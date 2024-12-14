const Queue = require('bull');
const { spawn } = require('child_process');

// Configure Redis connection (use Heroku Redis addon)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log(`[INIT] Redis URL: ${redisUrl}`);

// Create transcription queue
const transcriptionQueue = new Queue('transcription', redisUrl);
console.log('[INIT] Transcription queue created');

// Job processor
transcriptionQueue.process(async (job) => {
  console.log(`[PROCESS] Processing job ID: ${job.id}`);
  console.log(`[PROCESS] Job data: ${JSON.stringify(job.data)}`);

  const { files } = job.data;
  console.log(`[PROCESS] Files to process: ${files}`);

  return new Promise((resolve, reject) => {
    console.log(`[SPAWN] Spawning Python process for transcription`);
    const transcribeProcess = spawn('python', [
      '-c',
      `
import sys
import json
import os
import videogrep.transcribe as transcribe

results = {}

for file in ${JSON.stringify(files)}:
    try:
        transcript_file = file.rsplit('.', 1)[0] + '.json'
        
        if not os.path.exists(transcript_file):
            transcribe.transcribe(file)
        
        with open(transcript_file, 'r', encoding='utf-8') as f:
            results[file] = json.load(f)
    except Exception as e:
        results[file] = str(e)

print(json.dumps(results))
sys.stdout.flush()
      `
    ]);

    let resultData = '';
    let errorOutput = '';

    transcribeProcess.stdout.on('data', (data) => {
      console.log(`[PYTHON STDOUT] Data received: ${data}`);
      resultData += data.toString();
    });

    transcribeProcess.stderr.on('data', (data) => {
      console.error(`[PYTHON STDERR] Error output: ${data}`);
      errorOutput += data.toString();
    });

    transcribeProcess.on('close', (code) => {
      console.log(`[PROCESS] Python process exited with code: ${code}`);
      if (code === 0) {
        try {
          console.log('[PROCESS] Parsing transcription results');
          const transcripts = JSON.parse(resultData.trim());
          console.log('[PROCESS] Transcription results parsed successfully');
          resolve(transcripts);
        } catch (error) {
          console.error(`[ERROR] Parsing error: ${error.message}`);
          reject(new Error(`Parsing error: ${error.message}\nRaw data: ${resultData}`));
        }
      } else {
        console.error(`[ERROR] Transcription failed: ${errorOutput}`);
        reject(new Error(`Transcription failed: ${errorOutput}`));
      }
    });

    transcribeProcess.on('error', (err) => {
      console.error(`[ERROR] Python process error: ${err.message}`);
      reject(err);
    });
  });
});

module.exports = transcriptionQueue;


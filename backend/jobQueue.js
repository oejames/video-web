const Queue = require('bull');
const { spawn } = require('child_process');

// Configure Redis connection (use Heroku Redis addon)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Create transcription queue
const transcriptionQueue = new Queue('transcription', redisUrl);

// Job processor
transcriptionQueue.process(async (job) => {
  const { files } = job.data;
  
  return new Promise((resolve, reject) => {
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
      resultData += data.toString();
    });

    transcribeProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    transcribeProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const transcripts = JSON.parse(resultData.trim());
          resolve(transcripts);
        } catch (error) {
          reject(new Error(`Parsing error: ${error.message}\nRaw data: ${resultData}`));
        }
      } else {
        reject(new Error(`Transcription failed: ${errorOutput}`));
      }
    });

    transcribeProcess.on('error', (err) => {
      reject(err);
    });
  });
});

module.exports = transcriptionQueue;
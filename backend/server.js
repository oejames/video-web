const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only video files are allowed'));
  }
});

// Routes
app.post('/upload', upload.array('videos'), (req, res) => {
  const files = req.files.map(file => file.path);
  console.log('Files uploaded:', files);
  res.json({ files });
});

app.post('/transcribe', (req, res) => {
    console.log('Transcribe route hit!');
    console.log('Request body:', req.body);
    
    const { files } = req.body;
    console.log('Files to transcribe:', files);
    
    // Spawn a Python child process to handle transcription
    const transcribeProcess = spawn('python', [
      '-c',
      `
import sys
import json
import os
import videogrep.transcribe as transcribe

print("Python script started!", file=sys.stderr)
print(f"Received files: {sys.argv}", file=sys.stderr)

files = ${JSON.stringify(files)}
print(f"Parsed files: {files}", file=sys.stderr)
results = {}

for file in files:
    print(f"Processing file: {file}", file=sys.stderr)
    try:
        print(f"Attempting transcription for: {file}", file=sys.stderr)
        transcribe.transcribe(file)
        print(f"Transcription successful for: {file}", file=sys.stderr)
        
        # Read the generated transcript file
        transcript_file = file.rsplit('.', 1)[0] + '.json'
        print(f"Looking for transcript file: {transcript_file}", file=sys.stderr)
        
        if os.path.exists(transcript_file):
            print(f"Transcript file found: {transcript_file}", file=sys.stderr)
            with open(transcript_file, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"Transcript content length: {len(content)}", file=sys.stderr)
                results[file] = content
        else:
            print(f"Transcript file NOT found: {transcript_file}", file=sys.stderr)
            results[file] = f"Error: Transcript file not found at {transcript_file}"
    except Exception as e:
        print(f"Exception occurred: {str(e)}", file=sys.stderr)
        results[file] = str(e)

print("Printing JSON results", file=sys.stderr)
print(json.dumps(results))
print("Script completed!", file=sys.stderr)
    `
    ]);
    
    console.log('Spawned transcription process');
    
    let resultData = '';
    transcribeProcess.stdout.on('data', (data) => {
        console.log('Stdout data received:', data.toString());
        resultData += data;
    });
    
    transcribeProcess.stderr.on('data', (data) => {
        console.error('Transcribe stderr:', data.toString());
    });
    
    transcribeProcess.on('close', (code) => {
        console.log('Transcription process closed with code:', code);
        console.log("Full transcription result:", resultData);
        
        if (code === 0) {
            try {
                console.log('Attempting to parse result data');
                const transcripts = JSON.parse(resultData);
                console.log('Parsed transcripts:', transcripts);
                res.json(transcripts);
            } catch (error) {
                console.error('Parsing error:', error);
                console.error('Raw result data:', resultData);
                res.status(500).json({ 
                    error: 'Failed to parse transcription results', 
                    details: resultData 
                });
            }
        } else {
            console.error('Transcription process failed');
            res.status(500).json({ error: 'Transcription failed' });
        }
    });
});


app.post('/search', (req, res) => {
    const { files, query, searchType } = req.body;
    
    // Spawn a Python child process to handle search
    const searchProcess = spawn('python', [
      '-c', 
      `
import sys
import json
import videogrep

files = ${JSON.stringify(files)}
query = ${JSON.stringify(query)}
search_type = ${JSON.stringify(searchType)}

try:
    results = videogrep.search(files=files, query=query, search_type=search_type)
    print(json.dumps(results))
except Exception as e:
    print(json.dumps({'error': str(e)}))`
]);

let resultData = '';
searchProcess.stdout.on('data', (data) => {
    resultData += data;
});

searchProcess.stderr.on('data', (data) => {
    console.error(`Search stderr: ${data}`);
});

searchProcess.on('close', (code) => {
    if (code === 0) {
    try {
        const results = JSON.parse(resultData);
        res.json(results);
    } catch (error) {
        console.error('Parsing error:', error);
        res.status(500).json({ error: 'Failed to parse search results' });
    }
    } else {
    res.status(500).json({ error: 'Search failed' });
    }
});
});


app.post('/ngrams', (req, res) => {
    const { files, n } = req.body;
    
    const ngramProcess = spawn('python', [
      '-c', 
      `
import sys
import json
import videogrep
from collections import Counter

files = ${JSON.stringify(files)}
n = ${JSON.stringify(n)}

try:
    ngrams = videogrep.get_ngrams(files, n=n)
    most_common = Counter(ngrams).most_common(100)
    print(json.dumps(most_common))
except Exception as e:
    print(json.dumps({'error': str(e)}))`
]);

let resultData = '';
ngramProcess.stdout.on('data', (data) => {
    resultData += data;
});

ngramProcess.stderr.on('data', (data) => {
    console.error(`Ngrams stderr: ${data}`);
});

ngramProcess.on('close', (code) => {
    if (code === 0) {
    try {
        const parsedResults = JSON.parse(resultData);
        res.json(parsedResults);
    } catch (error) {
        console.error('Parsing error:', error);
        res.status(500).json({ error: 'Failed to parse ngrams' });
    }
    } else {
    res.status(500).json({ error: 'Ngrams generation failed' });
    }
});
});


app.post('/export', (req, res) => {
  const { files, query, searchType, padding, resync, output } = req.body;
  console.log('Export route hit. Files:', files, 'Query:', query, 'Search type:', searchType);

  // Export process to create supercut
  const exportProcess = spawn('python', [
    '-m', 'videogrep.videogrep',
    '--input', ...files,
    '--query', query,
    '--search-type', searchType,
    '--output', output,
    '--padding', padding.toString(),
    '--resync', resync.toString()
  ]);

  exportProcess.stdout.on('data', (data) => {
    console.log(`Export output: ${data}`);
  });

  exportProcess.stderr.on('data', (data) => {
    console.error(`Export error: ${data}`);
  });

  exportProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Export completed successfully');
      res.json({ success: true, output });
    } else {
      console.error('Export failed');
      res.status(500).json({ success: false, message: 'Export failed' });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

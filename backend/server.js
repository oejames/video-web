const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const transcriptionQueue = require('jobQueue');


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve videos from the "backend" folder
app.use('/videos', express.static(path.join(__dirname, 'backend')));

// Serve static files from React app
// app.use(express.static(path.join(__dirname, '../frontend/build')));


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
    cb(null, file.originalname);
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



// JOB QUEUE
app.post('/transcribe', async (req, res) => {
  try {
    const { files } = req.body;
    
    // Create a job in the queue
    const job = await transcriptionQueue.add({ files }, {
      // Optional job options
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      timeout: 5 * 60 * 1000 // 5 minute timeout
    });

    // Immediately respond with job ID
    res.json({ 
      jobId: job.id, 
      message: 'Transcription queued' 
    });
  } catch (error) {
    console.error('Queue error:', error);
    res.status(500).json({ error: 'Failed to queue transcription' });
  }
});

// New endpoint to check job status
app.get('/transcription-status/:jobId', async (req, res) => {
  try {
    const job = await transcriptionQueue.getJob(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    
    res.json({
      jobId: job.id,
      state,
      result: job.returnvalue,
      failed: state === 'failed',
      progress: job.progress()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve job status' });
  }
});

// // OG BEFORE JOB QUEUE
// app.post('/transcribe', (req, res) => {
//     console.log('Transcribe route hit!');
//     console.log('Request body:', req.body);
    
//     const { files } = req.body;
//     console.log('Files to transcribe:', files);
    
//     // Spawn a Python child process to handle transcription
//     const transcribeProcess = spawn('python', [
//       '-c',
//       `
// import sys
// import json
// import os
// import videogrep.transcribe as transcribe

// # Function to safely read transcript file
// def read_transcript_file(file_path):
//     try:
//         if os.path.exists(file_path):
//             with open(file_path, 'r', encoding='utf-8') as f:
//                 return json.load(f)
//         return None
//     except Exception as e:
//         print(f"Error reading transcript file {file_path}: {str(e)}", file=sys.stderr)
//         return None

// # Capture all print statements for debugging
// print("Python script started!", file=sys.stderr)
// files = ${JSON.stringify(files)}
// results = {}

// for file in files:
//     try:
//         print(f"Processing file: {file}", file=sys.stderr)
        
//         # Generate transcript if not already exists
//         transcript_file = file.rsplit('.', 1)[0] + '.json'
        
//         # If transcript doesn't exist, generate it
//         if not os.path.exists(transcript_file):
//             print(f"Generating transcript for {file}", file=sys.stderr)
//             transcribe.transcribe(file)
        
//         # Read the transcript
//         transcript_content = read_transcript_file(transcript_file)
        
//         if transcript_content is not None:
//             results[file] = transcript_content
//         else:
//             results[file] = f"Error: Could not read transcript file {transcript_file}"
//     except Exception as e:
//         print(f"Error processing {file}: {str(e)}", file=sys.stderr)
//         results[file] = str(e)

// # Ensure clean JSON output
// print(json.dumps(results))
// sys.stdout.flush()
//     `
//     ]);
    
//     let resultData = '';
//     let errorOutput = '';
    
//     transcribeProcess.stdout.on('data', (data) => {
//         console.log('Stdout data received:', data.toString());
//         resultData += data.toString();
//     });
    
//     transcribeProcess.stderr.on('data', (data) => {
//         const errorStr = data.toString();
//         console.error('Transcribe stderr:', errorStr);
//         errorOutput += errorStr;
//     });
    
//     transcribeProcess.on('close', (code) => {
//         console.log('Transcription process closed with code:', code);
        
//         if (code === 0) {
//             try {
//                 // Trim and clean the result data
//                 const cleanedData = resultData.trim()
//                     .split('\n')
//                     .filter(line => line.startsWith('{'))
//                     .join('\n');
                
//                 console.log('Cleaned result data:', cleanedData);
                
//                 const transcripts = JSON.parse(cleanedData);
                
//                 console.log('Parsed transcripts:', transcripts);
//                 res.json(transcripts);
//             } catch (error) {
//                 console.error('Parsing error:', error);
//                 console.error('Raw result data:', resultData);
//                 console.error('Error output:', errorOutput);
//                 res.status(500).json({ 
//                     error: 'Failed to parse transcription results', 
//                     details: {
//                         parseError: error.message,
//                         rawData: resultData,
//                         errorOutput: errorOutput
//                     }
//                 });
//             }
//         } else {
//             console.error('Transcription process failed');
//             res.status(500).json({ 
//                 error: 'Transcription failed', 
//                 details: errorOutput 
//             });
//         }
//     });

//     transcribeProcess.on('error', (err) => {
//         console.error('Spawn process error:', err);
//         res.status(500).json({ 
//             error: 'Failed to start transcription process',
//             details: err.message
//         });
//     });
// });

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
    console.log('Received request at /export endpoint');
    const { files, query, searchType, padding, resync, output } = req.body;
    console.log('Request body:', req.body);
  
    // Validate required parameters
    if (!files || !files.length) {
      console.error('Validation failed: No files provided');
      return res.status(400).json({ success: false, message: 'No files provided' });
    }
  
    if (!query) {
      console.error('Validation failed: No search query provided');
      return res.status(400).json({ success: false, message: 'No search query provided' });
    }
  
    // Determine output path
    // const outputPath = output || path.join(__dirname, 'exports', `supercut_${Date.now()}.mp4`);
    
    const uniqueFilename = `supercut_${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, 'exports', uniqueFilename);
    console.log('Output path determined:', outputPath);
  
    // Ensure exports directory exists
    const exportsDir = path.dirname(outputPath);
    if (!fs.existsSync(exportsDir)) {
      console.log('Exports directory does not exist. Creating:', exportsDir);
      try {
        fs.mkdirSync(exportsDir, { recursive: true });
        console.log('Exports directory created successfully');
      } catch (err) {
        console.error('Failed to create exports directory:', err);
        return res.status(500).json({ success: false, message: 'Failed to create exports directory', error: err.message });
      }
    } else {
      console.log('Exports directory exists:', exportsDir);
    }
  
    // Start export process
    console.log('Starting export process with parameters:', {
      input: files,
      query,
      searchType: searchType || 'word',
      output: outputPath,
      padding: padding || 0,
      resync: resync || 0
    });
  
    // Spawn Python process to call videogrep for export
    const exportProcess = spawn('python', [
      '-c',
      `
import sys
import json
import videogrep

files = ${JSON.stringify(files)}
query = ${JSON.stringify(query)}
search_type = ${JSON.stringify(searchType || 'word')}
output = ${JSON.stringify(outputPath)}
padding = ${JSON.stringify(padding || 0)}
resync = ${JSON.stringify(resync || 0)}

try:
    print("Starting export process...", file=sys.stderr)
    videogrep.videogrep(files=files, query=query, search_type=search_type, output=output, padding=padding, resync=resync)
    print("Export process completed successfully!", file=sys.stderr)
except Exception as e:
    print(f"Error during export process: {str(e)}", file=sys.stderr)
    sys.exit(1)
`
    ], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
  
    let errorOutput = '';
    exportProcess.stdout.on('data', (data) => {
      console.log(`Export process stdout: ${data.toString()}`);
    });
  
    exportProcess.stderr.on('data', (data) => {
      console.error(`Export process stderr: ${data.toString()}`);
      errorOutput += data.toString();
    });
  
    exportProcess.on('close', (code) => {
      console.log(`Export process closed with code: ${code}`);
      if (code === 0) {
        console.log('Export process completed successfully');
        res.json({ 
          success: true, 
          output: uniqueFilename,
          message: 'Supercut created successfully' 
        });
      } else {
        console.error('Export process failed with errors');
        res.status(500).json({ 
          success: false, 
          message: 'Export failed',
          error: errorOutput,
          code: code
        });
      }
    });
  
    exportProcess.on('error', (err) => {
      console.error('Spawn process encountered an error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to start export process',
        error: err.message
      });
    });
  
    console.log('Export process initiated');
  });

  app.get('/test-video', (req, res) => {
    const { filename } = req.query;
    
    if (!filename) {
      return res.status(400).send('Filename is required');
    }
  
    const videoPath = path.join(__dirname, 'exports', filename); 
    console.log(`Serving video: ${videoPath}`);
  
    // Check if the file exists
    if (fs.existsSync(videoPath)) {
      res.sendFile(videoPath);
    } else {
      res.status(404).send('Video not found');
    }
  });
  

  // Middleware for serving static files (like exported videos)
// app.use('/exports', express.static(path.join(__dirname, 'exports')));



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Serve static files from React app
const frontendBuildPath = path.join(__dirname, '../frontend/build');
console.log('Frontend build path:', frontendBuildPath);
app.use(express.static(frontendBuildPath));

// At the end of your server.js, add this route AFTER all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });


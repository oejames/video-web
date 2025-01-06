# VideoGrep Web Interface

A web interface for VideoGrep that allows transcribing videos, searching through transcripts and creating supercuts based on search terms. 

## Features

- Upload videos and generate transcripts
- Search through video transcripts by words or sentences  
- Create video supercuts from your search results
- Analyze word frequencies with N-gram analysis
- Real-time logs of transcription and export processes
- Drag and drop interface to reorder supercut segments
- Preview generated videos in browser

## Installation

Install dependencies and build frontend:
```bash
cd backend
npm install
pip install -r requirements.txt
cd ../frontend
npm install
npm run build
```
Start the server:

```bash
cd ../backend
npm start
```
The application will be available at http://localhost:3000

## Usage

1. Upload videos using the upload button
2. Click "Transcribe" to generate transcripts for your videos
3. Enter search terms and choose whether to search by words or sentences
4. Click "Search" to find matching video segments
5. Drag and drop results to reorder them (when using sentence mode)
6. Click "Export Supercut" to create a video of your selected segments

## Technical Notes

- Frontend built with React 
- Backend uses Express.js
- Python integration via child processes
- Real-time logging via Server-Sent Events (SSE)
- File management with Multer

## License
ISC License

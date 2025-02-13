# VideoGrep Web Interface

A web interface for VideoGrep that transcribes videos, searches through transcripts, and creates supercuts based on search terms. 

<img src="https://github.com/user-attachments/assets/57f25151-2282-4eaa-8e79-eb81841b3de5" alt="image" width="400" />




## Features

- Upload videos and generate transcripts
- Search through video transcripts by words or sentences  
- Create video supercuts from your search results
- Analyze word frequencies with N-gram analysis
- Real-time logs of transcription and export processes
- Preview generated videos in browser

## Installation

Install backend dependencies:
```bash
cd backend
npm install
pip install -r requirements.txt
```
Set up frontend:
```bash
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
5. Edit search results (in sentence mode) to select desired segments
6. Click "Export Supercut" to create a video of the selected segments

## License
ISC License

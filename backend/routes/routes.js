const path = require('path');
const fs = require('fs');
const upload = require('../middleware/middleware');
const videoController = require('../controllers/videoController');
const clients = new Set();


function sendLogToClients(log, type) {
    console.log("SENDING TO CLIENTS:", { log, type });
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({log, type})}\n\n`);
    });
}


module.exports = function(app) {
    app.get('/logs', (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const client = { id: Date.now(), res };
        clients.add(client);

        req.on('close', () => {
            clients.delete(client);
        });
    });

    app.post('/upload', upload.array('videos'), (req, res) => {
        const files = req.files.map(file => file.path);
        res.json({ files });
    });

    app.post('/transcribe', async (req, res) => {
        try {
            const transcripts = await videoController.handleTranscribe(
            req.body.files, 
                (log, type) => sendLogToClients(log, type)
            );
            res.json(transcripts);
        } catch (error) {
            res.status(500).json({ error: 'Transcription failed', details: error });
        }
    });

    app.post('/search', async (req, res) => {
        try {
            const { files, query, searchType } = req.body;
            const results = await videoController.handleSearch(files, query, searchType);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: 'Search failed', details: error });
        }
    });

    app.post('/ngrams', async (req, res) => {
        try {
            const { files, n } = req.body;
            const results = await videoController.handleNgrams(files, n);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: 'Ngrams failed', details: error });
        }
    });

    app.post('/export', async (req, res) => {
        try {
            const { files, query, searchType, padding, resync } = req.body;
            
            if (!files?.length) {
                return res.status(400).json({ success: false, message: 'No files provided' });
            }
            if (!query) {
                return res.status(400).json({ success: false, message: 'No search query provided' });
            }

            const filename = await videoController.handleExport(
                req.body.files,
                req.body.query,
                req.body.searchType,
                req.body.padding,
                req.body.resync,
                (log, type) => sendLogToClients(log, type)
            );
            
            
            res.json({ success: true, output: filename, message: 'Supercut created successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Export failed', error });
        }
    });

    app.get('/test-video', (req, res) => {
        const { filename } = req.query;
        if (!filename) {
            return res.status(400).send('Filename is required');
        }
        // const videoPath = path.join(__dirname, 'exports', filename);
        const videoPath = path.join(__dirname, '..', 'controllers', 'exports', filename);
        if (fs.existsSync(videoPath)) {
            res.sendFile(videoPath);
        } else {
            res.status(404).send('Video not found');
        }
    });
};
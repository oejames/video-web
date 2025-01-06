const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes/routes');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
// app.use('/videos', express.static(path.join(__dirname, 'backend')));
app.use('/videos', express.static(path.join(__dirname, 'controllers', 'exports')));

// routes
routes(app);

// static files from react
const frontendBuildPath = path.join(__dirname, '../frontend/build');
console.log('Frontend build path:', frontendBuildPath);
app.use(express.static(frontendBuildPath));

// catch-all route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

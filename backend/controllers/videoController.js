const path = require('path');
const fs = require('fs');
const { runPythonProcess } = require('../utils/pythonHelper');
const { transcribeScript, searchScript, ngramsScript, exportScript } = require('../utils/pythonScripts');

async function handleTranscribe(files, onLog) {
    const { result, error } = await runPythonProcess(
        transcribeScript(files),
        {},
        onLog
    );
    const cleanedData = result.trim()
        .split('\n')
        .filter(line => line.startsWith('{'))
        .join('\n');
    return JSON.parse(cleanedData);
}

async function handleSearch(files, query, searchType) {
    const { result } = await runPythonProcess(searchScript(files, query, searchType));
    return JSON.parse(result);
}

async function handleNgrams(files, n) {
    const { result } = await runPythonProcess(ngramsScript(files, n));
    return JSON.parse(result);
}

async function handleExport(files, query, searchType, padding, resync, onLog) {
    const uniqueFilename = `supercut_${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, 'exports', uniqueFilename);
    
    // Ensure exports directory exists
    const exportsDir = path.dirname(outputPath);
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }

    await runPythonProcess(
        exportScript(files, query, searchType, outputPath, padding, resync),
        { stdio: ['ignore', 'pipe', 'pipe'] },
        onLog
    );

    return uniqueFilename;
}

module.exports = {
    handleTranscribe,
    handleSearch,
    handleNgrams,
    handleExport
};
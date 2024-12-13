import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function VideogrepApp() {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Sentences');
  const [padding, setPadding] = useState(0);
  const [resync, setResync] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [nGrams, setNGrams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('videos', files[i]);
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setVideos(response.data.files);
      
      // Automatically get ngrams and do initial search
      await handleNGrams(1);
      await handleSearch();
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscribe = async () => {
    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/transcribe`, { files: videos });
      alert('Transcription complete');
    } catch (error) {
      console.error('Transcription failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (videos.length === 0 || !searchQuery.trim()) return;

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/search`, {
        files: videos,
        query: searchQuery,
        searchType: searchType.toLowerCase() === 'sentences' ? 'sentence' : 'fragment'
      });
      
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNGrams = async (n = 1) => {
    if (videos.length === 0) return;

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/ngrams`, {
        files: videos,
        n
      });
      
      const formattedNGrams = response.data.map(
        ([ngram, count]) => `${ngram.join(' ')} (${count})`
      );
      
      setNGrams(formattedNGrams);
    } catch (error) {
      console.error('N-grams generation failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (videos.length === 0 || !searchQuery.trim()) return;

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/videogrep`, {
        files: videos,
        query: searchQuery,
        searchType: searchType.toLowerCase() === 'sentences' ? 'sentence' : 'fragment',
        padding: padding / 1000,
        resync: resync / 1000,
        output: 'supercut.mp4'
      });
      
      alert(`Exported to ${response.data.output}`);
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Videogrep Web</h1>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-white"></div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Videos</h2>
          <input 
            type="file" 
            multiple 
            accept=".mp4,.mov,.avi,.webm,.mkv"
            onChange={handleFileUpload} 
            className="mb-2"
          />
          
          <div className="mb-2">
            <strong>Uploaded Videos:</strong>
            <ul>
              {videos.map((video, index) => (
                <li key={index}>{video.split('/').pop()}</li>
              ))}
            </ul>
          </div>

          <button 
            onClick={handleTranscribe}
            disabled={videos.length === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Transcribe
          </button>

          <div className="mt-4">
            <input 
              type="text"
              placeholder="Search query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border p-2 w-full mb-2"
            />

            <select 
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="border p-2 w-full mb-2"
            >
              <option>Sentences</option>
              <option>Words</option>
            </select>

            <button 
              onClick={handleSearch}
              disabled={videos.length === 0 || !searchQuery.trim()}
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Search
            </button>
          </div>

          <div className="mt-4">
            <label className="block">
              Padding (ms):
              <input 
                type="number"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                min={0}
                max={1000}
                className="border p-2 w-full"
              />
            </label>

            <label className="block mt-2">
              Shift (ms):
              <input 
                type="number"
                value={resync}
                onChange={(e) => setResync(Number(e.target.value))}
                min={-1000}
                max={1000}
                className="border p-2 w-full"
              />
            </label>
          </div>

          <button 
            onClick={handleExport}
            disabled={videos.length === 0 || !searchQuery.trim()}
            className="mt-4 bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Export Supercut
          </button>
        </div>

        <div className="border p-4 rounded">
          <div>
            <h2 className="text-xl font-semibold mb-2">Search Results</h2>
            {searchResults.length > 0 ? (
              <pre className="overflow-auto max-h-96">
                {searchResults.map((result, index) => (
                  <div key={index}>
                    {`${result.start.toFixed(2)} - ${result.end.toFixed(2)}: ${result.content}`}
                  </div>
                ))}
              </pre>
            ) : (
              <p>No results</p>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Common N-Grams</h2>
            <select 
              onChange={(e) => handleNGrams(Number(e.target.value))}
              className="border p-2 w-full mb-2"
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>N-Grams (n={n})</option>
              ))}
            </select>

            {nGrams.length > 0 && (
              <pre className="overflow-auto max-h-96">
                {nGrams.map((gram, index) => (
                  <div key={index}>{gram}</div>
                ))}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideogrepApp;
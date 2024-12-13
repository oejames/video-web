import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function VideogrepApp() {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Sentences');
  const [padding, setPadding] = useState(0);
  const [resync, setResync] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [editableResults, setEditableResults] = useState([]);
  const [nGrams, setNGrams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transcripts, setTranscripts] = useState({});
  const [activeTab, setActiveTab] = useState('search');
  const [exportedVideoPath, setExportedVideoPath] = useState('');
  const [isLiveSearch, setIsLiveSearch] = useState(true);

  // Flatten transcripts for live search
  const allTranscriptSegments = useMemo(() => {
    return Object.values(transcripts).flat();
  }, [transcripts]);

  // Live search function
  const liveSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return allTranscriptSegments;

    const lowerQuery = searchQuery.toLowerCase();
    return allTranscriptSegments.filter(segment => 
      segment.content.toLowerCase().includes(lowerQuery)
    );
  }, [allTranscriptSegments, searchQuery]);

    // Effect to set initial full transcript results when transcripts are loaded
    useEffect(() => {
      if (Object.keys(transcripts).length > 0) {
        setEditableResults(allTranscriptSegments);
      }
    }, [transcripts, allTranscriptSegments]);

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
      // await handleNGrams(1);
      // await handleTranscribe();
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscribe = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/transcribe`, { files: videos });
      setTranscripts(response.data);
      await handleNGrams(1);
      setActiveTab('transcripts');
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
      setEditableResults(response.data);
      setActiveTab('search');
      setIsLiveSearch(false);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle drag and drop
  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const newResults = Array.from(editableResults);
    const [reorderedItem] = newResults.splice(result.source.index, 1);
    newResults.splice(result.destination.index, 0, reorderedItem);

    setEditableResults(newResults);
  }, [editableResults]);

  // Function to remove a specific result
  const removeResult = useCallback((indexToRemove) => {
    const newResults = editableResults.filter((_, index) => index !== indexToRemove);
    setEditableResults(newResults);
  }, [editableResults]);

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
      setActiveTab('ngrams');
    } catch (error) {
      console.error('N-grams generation failed', error);
    } finally {
      setIsLoading(false);
    }
  };

const handleExport = async () => {
    // Reset exported video path to null or an empty string
    setExportedVideoPath('');
    
  if (videos.length === 0 || editableResults.length === 0) {
    console.error("No videos or search results provided.");
    return;
  }

  const exportQuery = editableResults
    .map(result => result.content.trim())
    .join('|');

  try {
    setIsLoading(true);
    const response = await axios.post(`${API_URL}/export`, {
      files: videos,
      query: exportQuery,
      searchType: searchType.toLowerCase() === 'sentences' ? 'sentence' : 'fragment',
      padding: padding / 1000,
      resync: resync / 1000,
      output: 'supercut.mp4'
    });

    alert(`Exported to ${response.data.output}`);
    setExportedVideoPath(`${API_URL}/test-video?ts=${Date.now()}`);
  } catch (error) {
    console.error('Export failed:', error.response || error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    setIsLoading(false);
  }
};




  const handleSearchQueryChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // If query is empty, reset to full transcript segments
    if (!query.trim()) {
      setIsLiveSearch(true);
      setEditableResults(allTranscriptSegments);
      return;
    }
  
    setIsLiveSearch(true);
    setEditableResults(liveSearchResults);
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
              onChange={handleSearchQueryChange}
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
              {isLiveSearch ? 'Advanced Search' : 'Search'}
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
            disabled={videos.length === 0 || editableResults.length === 0}
            className="mt-4 bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Export Supercut ({editableResults.length} results)
          </button>
        </div>

        <div className="border p-4 rounded">
          <div className="flex mb-4">
            <button 
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 mr-2 rounded ${activeTab === 'search' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Search Results
            </button>
            <button 
              onClick={() => setActiveTab('ngrams')}
              className={`px-4 py-2 mr-2 rounded ${activeTab === 'ngrams' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              N-Grams
            </button>
            <button 
              onClick={() => setActiveTab('transcripts')}
              className={`px-4 py-2 rounded ${activeTab === 'transcripts' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Transcripts
            </button>
          </div>

          {activeTab === 'search' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Search Results</h2>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="search-results">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {editableResults.map((result, index) => (
                        <Draggable 
                          key={`${result.start}-${result.end}`} 
                          draggableId={`${result.start}-${result.end}`} 
                          index={index}
                        >
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center bg-gray-100 p-2 rounded"
                            >
                              <span className="flex-grow">
                                {`${result.start.toFixed(2)} - ${result.end.toFixed(2)}: ${result.content}`}
                              </span>
                              <button 
                                onClick={() => removeResult(index)}
                                className="ml-2 text-red-500 hover:text-red-700"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}

          {activeTab === 'ngrams' && (
            <div>
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
          )}

          {activeTab === 'transcripts' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Transcripts</h2>
              {Object.entries(transcripts).length > 0 ? (
                Object.entries(transcripts).map(([file, transcript]) => (
                  <div key={file} className="mb-4">
                    <h3 className="font-semibold">{file.split('/').pop()}</h3>
                    <pre className="overflow-auto max-h-96 bg-gray-100 p-2 rounded">
                      {transcript.map((segment, index) => (
                        <div key={index}>
                          {`${segment.start.toFixed(2)} - ${segment.end.toFixed(2)}: ${segment.content}`}
                        </div>
                      ))}
                    </pre>
                  </div>
                ))
              ) : (
                <p>No transcripts available</p>
              )}
            </div>
          )}
        </div>
        {exportedVideoPath && (
  <div className="mt-4">
    <h2 className="text-xl font-semibold">Exported Video</h2>
    <video 
      controls 
      className="w-full border p-2 rounded"
      src={`${exportedVideoPath}`}
    >
      Your browser does not support the video tag.
    </video>
  </div>
)}

      </div>
    </div>
  );
}

export default VideogrepApp;
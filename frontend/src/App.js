import React, { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  FaVideo, 
  // FaSearch, 
  // FaTrash, 
  FaFileUpload, 
  FaCut, 
  // FaListAlt, 
  // FaFilm, 
  FaSpinner 
} from 'react-icons/fa';


const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';



function VideogrepApp() {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Sentences');
  const [padding, setPadding] = useState(0);
  const [resync, setResync] = useState(0);
  // const [searchResults, setSearchResults] = useState([]);
  const [editableResults, setEditableResults] = useState([]);
  const [nGrams, setNGrams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [transcripts, setTranscripts] = useState({});
  const [activeTab, setActiveTab] = useState('search');
  const [exportedVideoPath, setExportedVideoPath] = useState('');
  // const [isLiveSearch, setIsLiveSearch] = useState(true);
  

    // Function to check if one result contains another result
    const isResultContained = useCallback((result1, result2) => {
      // Normalize the content by removing extra whitespace and converting to lowercase
      const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
      
      const norm1 = normalize(result1.content);
      const norm2 = normalize(result2.content);
  
      // Check if one result is a substring of another
      return norm1.includes(norm2) || norm2.includes(norm1);
    }, []);
  
    // Modified remove result function with containment check
    const removeResult = useCallback((indexToRemove) => {
      const currentResult = editableResults[indexToRemove];
      
      // Check if removing this result would impact other results
      const containedResults = editableResults.filter((result, index) => 
        index !== indexToRemove && isResultContained(currentResult, result)
      );
  
      // LIKELY REDUNDANT bc its not supposed to have an x anyway?// If the result would impact other results, show a warning
      if (containedResults.length > 0) {
        const confirmed = window.confirm(
          "Removing this result may affect other search results that contain similar words. " + 
          `${containedResults.length} other result(s) will remain. Do you want to continue?`
        );
        
        if (!confirmed) {
          return;
        }
      }
  
      // Proceed with removal
      const newResults = editableResults.filter((_, index) => index !== indexToRemove);
      setEditableResults(newResults);
    }, [editableResults, isResultContained]);

  // Flatten transcripts for search
  const allTranscriptSegments = useMemo(() => {
    return Object.values(transcripts).flat();
  }, [transcripts]);

  // Effect to set initial full transcript results when transcripts are loaded
  // useEffect(() => {
  //   if (Object.keys(transcripts).length > 0) {
  //     // setEditableResults(allTranscriptSegments);
  //   }
  // }, [transcripts, allTranscriptSegments]);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('videos', files[i]);
    }

    try {
      // setIsLoading(true);
      setIsUploading(true); // Set to true when the upload starts
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
      setIsUploading(false); 
      // setIsLoading(false);
    }
  };

  const handleTranscribe = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/transcribe`, { files: videos });
      setTranscripts(response.data);
      setActiveTab('transcripts');
      await handleNGrams(1);
      // alert('Transcription complete');
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
      
      // setSearchResults(response.data);
      setEditableResults(response.data);
      setActiveTab('search');
      // setIsLiveSearch(false);
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

  // // Function to remove a specific result
  // const removeResult = useCallback((indexToRemove) => {
  //   const newResults = editableResults.filter((_, index) => index !== indexToRemove);
  //   setEditableResults(newResults);
  // }, [editableResults]);

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
      // setActiveTab('ngrams');
    } catch (error) {
      console.error('N-grams generation failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    // Reset exported video path to null or an empty string
    setExportedVideoPath('');
    
    if (videos.length === 0) {
      console.error("No videos provided.");
      return;
    }
  
    // Different query logic based on search type
    const exportQuery = searchType === 'Words' 
      ? searchQuery  // For words, use the original search query
      : editableResults
        .map(result => result.content.trim())
        .join('|');  // For sentences, use the editable results
  
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/export`, {
        files: videos,
        query: exportQuery,
        searchType: searchType.toLowerCase() === 'sentences' ? 'sentence' : 'fragment',
        padding: padding / 1000,
        resync: resync / 1000
      });
  
      setExportedVideoPath(`${API_URL}/test-video?filename=${encodeURIComponent(response.data.output)}`);
  
    } catch (error) {
      console.error('Export failed:', error.response || error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    } finally {
      setIsLoading(false);
      setActiveTab('video')
    }
  };




  const handleSearchQueryChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // If query is empty, show full transcript
    if (!query.trim()) {
      // setEditableResults(allTranscriptSegments);
      return;
    }

  };

  const handleSearchTypeChange = async (newSearchType) => {
    if (videos.length === 0 || !searchQuery.trim()) {
      // If no videos or no query, just update the search type
      setSearchType(newSearchType);
      return;
    }

    // Set the new search type
    setSearchType(newSearchType);

    // Trigger a new search with the updated search type
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/search`, {
        files: videos,
        query: searchQuery,
        searchType: newSearchType.toLowerCase() === 'sentences' ? 'sentence' : 'fragment'
      });
      
      // setSearchResults(response.data);
      setEditableResults(response.data);
      setActiveTab('search');
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
               <FaVideo className="text-3xl" />
              <h1 className="text-3xl font-bold tracking-tight">Videogrep Web</h1>
              </div>
              {isLoading && (
                <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                                 <FaSpinner className="animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 p-6">
            {/* Left Column: Video and Search Controls */}
            <div className="space-y-6">
              {/* Video Upload Section */}
              <div className="bg-gray-100 p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FaFileUpload className="mr-2 text-blue-600" />
                  Video Upload</h2>
                <input 
                  type="file" 
                  multiple 
                  accept=".mp4,.mov,.avi,.webm,.mkv"
                  onChange={handleFileUpload} 
                  className="w-full file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100 mb-2"
                />
                {isUploading && (
                  <FaSpinner className="animate-spin text-blue-500 mt-2" />
                )}
                
                <div className="mb-2 ">
                  <strong>Uploaded Videos:</strong>
                  <ul className='overflow-auto max-h-25'>
                    {videos.map((video, index) => (
                      <li 
                        key={index} 
                        className=""
                      >
                        {video.split('/').pop()}
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={handleTranscribe}
                  disabled={videos.length === 0}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  Transcribe
                </button>

                <div className="mt-4 space-y-4">
                  <input 
                    type="text"
                    placeholder="Search query"
                    value={searchQuery}
                    onChange={handleSearchQueryChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />

                  <select 
                    value={searchType}
                    onChange={(e) => handleSearchTypeChange(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option>Sentences</option>
                    <option>Words</option>
                  </select>

                  <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleSearch}
                    disabled={videos.length === 0 || !searchQuery.trim()}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    Search
                  </button>

                  <button 
                    onClick={handleExport}
                    disabled={videos.length === 0 || editableResults.length === 0}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center justify-center"
                                        >
                                          <FaCut className="mr-2" />
                    Export Supercut ({editableResults.length} results)
                  </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Results and Tabs */}
            <div className="bg-white border rounded-xl shadow-md">
              {/* Tabs */}
              <div className="flex border-b">
                <button 
                  onClick={() => setActiveTab('search')}
                  className={`flex-1 px-4 py-3 transition ${activeTab === 'search' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Search Results
                </button>
                <button 
                  onClick={() => setActiveTab('ngrams')}
                  className={`flex-1 px-4 py-3 transition ${activeTab === 'ngrams' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  N-Grams
                </button>
                <button 
                  onClick={() => setActiveTab('transcripts')}
                  className={`flex-1 px-4 py-3 transition ${activeTab === 'transcripts' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Transcripts
                </button>
                <button 
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 px-4 py-3 transition ${activeTab === 'video' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Finished Video
                </button>
              </div>

              {/* Tab Content */}
              <div className="overflow-auto" style={{ height: '520px' }}>
              <div className="p-6">
                {activeTab === 'search' && (
                  <div>
                    <h2 className="text-xl font-semibold mb-2">Search Results</h2>
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="search-results">
                        {(provided) => (
                          <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef}
                            className="space-y-2 "
                          >
                            {editableResults.map((result, index) => {
                              const containedResults = editableResults.filter((otherResult, otherIndex) => 
                                index !== otherIndex && isResultContained(result, otherResult)
                              );

                              return (
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
                                      {/* <span className="flex-grow font-mono">  */}
                                      <span className="flex-grow "> 
                                        {`${result.start.toFixed(2)} - ${result.end.toFixed(2)}: ${result.content}`}
                                      </span>
                                      {searchType === 'Sentences' && containedResults.length === 0 && (
                                        <button 
                                          onClick={() => removeResult(index)}
                                          className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
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

                {activeTab === 'video' && (
                  <div className='mt-4'>
                    {exportedVideoPath ? (
                      <video 
                        controls 
                        className="w-full border p-2 rounded"
                        src={`${exportedVideoPath}`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <p>Click 'export supercut' to see the finished video</p>
                    )}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideogrepApp;
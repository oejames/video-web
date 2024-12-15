import React, { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';

export function useVideoProcessing() {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('Sentences');
  const [padding] = useState(0);
  const [resync] = useState(0);
  const [editableResults, setEditableResults] = useState([]);
  const [nGrams, setNGrams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [transcripts, setTranscripts] = useState({});
  const [activeTab, setActiveTab] = useState('search');
  const [exportedVideoPath, setExportedVideoPath] = useState('');

  const isResultContained = useCallback((result1, result2) => {
    const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
    
    const norm1 = normalize(result1.content);
    const norm2 = normalize(result2.content);

    return norm1.includes(norm2) || norm2.includes(norm1);
  }, []);

  const removeResult = useCallback((indexToRemove) => {
    const currentResult = editableResults[indexToRemove];
    
    const containedResults = editableResults.filter((result, index) =>
      index !== indexToRemove && isResultContained(currentResult, result)
    );

    if (containedResults.length > 0) {
      const confirmed = window.confirm(
        "Removing this result may affect other search results that contain similar words. " +
        `${containedResults.length} other result(s) will remain. Do you want to continue?`
      );
      
      if (!confirmed) {
        return;
      }
    }

    const newResults = editableResults.filter((_, index) => index !== indexToRemove);
    setEditableResults(newResults);
  }, [editableResults, isResultContained]);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('videos', files[i]);
    }

    try {
      setIsUploading(true);
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setVideos(response.data.files);
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTranscribe = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/transcribe`, { files: videos });
      setTranscripts(response.data);
      setActiveTab('transcripts');
      await handleNGrams(1);
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
      
      setEditableResults(response.data);
      setActiveTab('search');
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const newResults = Array.from(editableResults);
    const [reorderedItem] = newResults.splice(result.source.index, 1);
    newResults.splice(result.destination.index, 0, reorderedItem);

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
    } catch (error) {
      console.error('N-grams generation failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setExportedVideoPath('');
    
    if (videos.length === 0) {
      console.error("No videos provided.");
      return;
    }
   
    const exportQuery = searchType === 'Words'
      ? searchQuery   
      : editableResults
        .map(result => result.content.trim())
        .join('|');   
    
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
      setActiveTab('video');
    }
  };

  const handleSearchQueryChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleSearchTypeChange = async (newSearchType) => {
    if (videos.length === 0 || !searchQuery.trim()) {
      setSearchType(newSearchType);
      return;
    }

    setSearchType(newSearchType);

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/search`, {
        files: videos,
        query: searchQuery,
        searchType: newSearchType.toLowerCase() === 'sentences' ? 'sentence' : 'fragment'
      });
      
      setEditableResults(response.data);
      setActiveTab('search');
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    videos,
    setVideos,
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    padding,
    resync,
    editableResults,
    setEditableResults,
    nGrams,
    isLoading,
    isUploading,
    transcripts,
    activeTab,
    setActiveTab,
    exportedVideoPath,
    isResultContained,
    removeResult,
    handleFileUpload,
    handleTranscribe,
    handleSearch,
    onDragEnd,
    handleNGrams,
    handleExport,
    handleSearchQueryChange,
    handleSearchTypeChange
  };
}
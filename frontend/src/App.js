import React from 'react';
import Header from './components/Header';
import VideoUpload from './components/VideoUpload';
import SearchControls from './components/SearchControls';
import Tabs from './components/Tabs';
import TabContent from './components/TabContent';
import { useVideoProcessing } from './hooks/useVideoProcessing';

function App() {
  const {
    videos,
    searchQuery,
    searchType,
    editableResults,
    nGrams,
    transcripts,
    activeTab,
    setActiveTab,
    exportedVideoPath,
    isLoading,
    isUploading,
    handleFileUpload,
    handleTranscribe,
    handleSearch,
    onDragEnd,
    handleNGrams,
    handleExport,
    removeResult,
    isResultContained,
    handleSearchQueryChange,
    handleSearchTypeChange
  } = useVideoProcessing();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <Header isLoading={isLoading} />
          <div className="grid md:grid-cols-2 gap-6 p-6">
            <div className="space-y-6">
              <VideoUpload
                handleFileUpload={handleFileUpload}
                isUploading={isUploading}
                videos={videos}
              />
              <button
                onClick={handleTranscribe}
                disabled={videos.length === 0}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                Transcribe
              </button>
              <SearchControls
                handleSearchQueryChange={handleSearchQueryChange}
                handleSearchTypeChange={handleSearchTypeChange}
                handleSearch={handleSearch}
                handleExport={handleExport}
                searchQuery={searchQuery}
                searchType={searchType}
                videos={videos}
                editableResults={editableResults}
              />
            </div>
            <div className="bg-white border rounded-xl shadow-md">
              <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabContent
                activeTab={activeTab}
                editableResults={editableResults}
                onDragEnd={onDragEnd}
                isResultContained={isResultContained}
                removeResult={removeResult}
                nGrams={nGrams}
                handleNGrams={handleNGrams}
                transcripts={transcripts}
                exportedVideoPath={exportedVideoPath}
                searchType={searchType}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
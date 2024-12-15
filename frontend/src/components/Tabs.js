
  
// Tabs component  
const Tabs = ({ activeTab, setActiveTab }) => {  
  return (  
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
  );  
};  

export default Tabs;
  
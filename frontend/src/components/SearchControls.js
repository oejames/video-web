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

// Search controls component  
const SearchControls = ({  
    handleSearchQueryChange,  
    handleSearchTypeChange,  
    handleSearch,  
    handleExport,  
    searchQuery,  
    searchType,  
    videos,  
    editableResults  
  }) => {  
    return (  
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
    );  
  };  

  export default SearchControls;
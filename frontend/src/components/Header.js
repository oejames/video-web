// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
FaVideo,
// FaSearch,
// FaTrash,
// FaFileUpload,
// FaCut,
// FaListAlt,
// FaFilm,
FaSpinner
} from 'react-icons/fa';

const Header = ({ isLoading }) => {  
  return (  
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
  );  
};  

export default Header;
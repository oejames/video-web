import {
// FaVideo,
// FaSearch,
// FaTrash,
FaFileUpload,
// FaCut,
// FaListAlt,
// FaFilm,
FaSpinner
} from 'react-icons/fa';


// Video upload component  
const VideoUpload = ({ handleFileUpload, isUploading, videos }) => {  
  return (  
   <div className="bg-gray-100 p-6 rounded-xl shadow-md">  
    <h2 className="text-xl font-semibold mb-4 flex items-center">  
      <FaFileUpload className="mr-2 text-blue-600" />  
      Video Upload  
    </h2>  
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
   </div>  
  );  
};  

export default VideoUpload;
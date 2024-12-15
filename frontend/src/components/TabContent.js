import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';  

// Tab content component  
const TabContent = ({  
    activeTab,  
    editableResults,  
    onDragEnd,  
    isResultContained,  
    removeResult,  
    nGrams,  
    handleNGrams,  
    transcripts,  
    exportedVideoPath,
    searchType
  }) => {  
    return (  
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
                  {`${segment.start.toFixed(2)} -${segment.end.toFixed(2)}: ${segment.content}`}  
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
    );  
  };  

  export default TabContent;
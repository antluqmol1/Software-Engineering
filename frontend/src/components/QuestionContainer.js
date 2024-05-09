import React from "react";
export function QuestionContainer({
  waitingForSpin,
  pickedPlayer,
  taskPoints,
  taskText,
  username,
  voteTask,
  taskId
}) {
  return <div className="questions-container">

        {waitingForSpin ? <div className="group-question">
            <p className="font-style">Wheel is selecting a player...</p>
          </div> : <div className="group-question">
            <h2 className="font-style-prompt">Challenge</h2>
            <p className="font-style">{pickedPlayer}'s task</p>
            <p className="font-style">Points: {taskPoints}</p>
            <p className="font-style">task: {taskText}</p>


        
    {pickedPlayer != username && taskText && <div>

            <button className="yes-button btn btn-sm btn-primary" onClick={() => voteTask("yes", taskId)}>
              Yes
          
            </button>
            <button className="no-button btn btn-sm btn-danger" onClick={() => voteTask("no", taskId)}>
              No
            </button>
            <button className="undecided-button btn btn-sm btn-warning" onClick={() => voteTask("skip", taskId)}>
              Skip
            </button>
        
          </div>}
        </div>}
      </div>;
}


export default QuestionContainer;
  
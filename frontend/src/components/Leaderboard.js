import React, {useEffect} from "react";
import "../styles/GameLobby.css";
import "../styles/App.css";
import "../styles/Leaderboard.css";

import { useState } from "react";


export function Leaderboard({
  playerList,
  endgame
}) 


{
  useEffect(() => {
    //Sort the leaderboard
    playerList = playerList.sort((a, b) => b.score - a.score);
    console.log("PLAYER LIST ", playerList);
  }, [playerList]);

  const [showLeaderBoard, setShowLeaderBoard] = useState(true);

  const handleLeaderBoardShow = () => {

    if (showLeaderBoard)
    {
      setShowLeaderBoard(false);
    }
    else
    {
      setShowLeaderBoard(true);
    }
    console.log(showLeaderBoard)
  };


  return <div className={endgame ? "leaderboard-container-end" : "leaderboard-container"}>

    { !endgame && playerList &&
      <button className='showhide-button' onClick={handleLeaderBoardShow}> 
          {showLeaderBoard ? 'b' : 'z'}
        </button>
    }

        {playerList && showLeaderBoard && <div className="leaderboard">
          <div className="leaderboard-body">
            <h2 className="leaderboard-h">{endgame ? 'Final scores' : 'Leaderboard'}</h2>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {
              /* Display leaderboard content here */
            }
                {
              /* Map through players array to display each player and their score */
            }
                {playerList.map((player, index) => <div className="leaderboard-item" key={index}>
                    <span className="me-2">{player.username}</span>
                    <span className="score">
                      {player.score}
                    </span>
                  </div>)}
              </div>
            </div>
          </div>
          </div>}
      </div>;
}
export default Leaderboard;
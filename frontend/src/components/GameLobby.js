import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import axios from "axios";
import Cookies from "universal-cookie";
import "../styles/GameLobby.css";
import "../styles/App.css";
import "bootstrap/dist/css/bootstrap.min.css"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faQuestion } from "@fortawesome/free-solid-svg-icons";


function GameLobby() {
    const [playerList, setPlayerList] = useState([]);
    const [username, setUsername] = useState(null);
    const [admin, setAdmin] = useState(false);
    const [gameID, setGameID] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [taskText, setTaskText] = useState(null);
    const [taskPoints, setTaskPoints] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [yesVotes, setYesVotes] = useState(0);
    const [noVotes, setNoVotes] = useState(0);
    const [skipVotes, setSkipVotes] = useState(0);
    const [pickedPlayer, setPickedPlayer] = useState(null);
    const [totalVotes, setTotalVotes] = useState(0); // New state for total votes
    const navigate = useNavigate();
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");
    const webSocketRef = useRef(null);
    const [checkmarksLine1, setCheckmarksLine1] = useState([]);
    const [exesLine2, setExesLine2] = useState([]);
    const [questionLine3, setQuestionLine3] = useState([]);

    const handleDelete = () => {  

        console.log("Ending/Deleting game...")

        axios
        .delete(
            "http://localhost:8000/delete-game/",
            {
            headers: {
                "X-CSRFToken": token, // Include CSRF token in headers
            },
            }
        )
        .then((response) => {
            if (response.data['success'] === true) {

              console.log("Game deleted successfully")

                // Send an end game message to the backend.
                // if (webSocketRef.current) {
                //   console.log("sending game_end message to WS")
                //   webSocketRef.current.send(JSON.stringify({
                //       type: 'game_end',
                //       user: username
                //   }));
                // }
                navigate("/");
            }
            else {
                console.log("failed to delete game");
            }

        return response.data;
      })
      .catch((error) => {
        console.error("Error getting players:", error);
        return null;
      });
  };

    // Request to backend for leaving game(removing player from DB).
    const handleLeave = () => {
        axios
        .put(
            "http://localhost:8000/leave-game/",
            null,
            {
                headers: {
                    "X-CSRFToken": token, // Include CSRF token in headers
                },
            }
        )
        .then((response) => {
            if (response.data['success'] === true) {
                navigate("/");
            }
            else {
                console.log("failed to leave game");
            }

        return response.data;
      })
      .catch((error) => {
        console.error("Error getting players:", error);
        return null;
      });
  };


  // Function to fetch the list of participants from the server
  const fetchPlayerList = () => {
    axios.get("http://localhost:8000/get-game-participants/", {
        headers: {
          "X-CSRFToken": token, // Include CSRF token in headers
        },
      })
      .then((response) => {
        setPlayerList(response.data.participants);
      })
      .catch((error) => {
        console.error("Error fetching player list:", error);
      });
  };

    const fetchGame = () => {
        axios.get("http://localhost:8000/get-game/",
            {
                headers: {
                    "X-CSRFToken": token, // Include CSRF token in headers
                },
            })
            .then(response => {
                setAdmin(response.data["isAdmin"]);
                setGameID(response.data["gameId"]);
                setGameStarted(response.data["gameStarted"]);
                setUsername(response.data['username']);
            })
            .catch(error => {
                console.error("Error fetching game ID:", error);
            });

            // Condition to fetch the current task if the game is started
            // Im confused, why do we fetch current task if the game is NOT started???
            if (!gameStarted) {
              axios.get("http://localhost:8000/game/current-task/",
              {
                  headers: {
                      "X-CSRFToken": token, // Include CSRF token in headers
                  },
              })
              .then(response => {
                  setTaskText(response.data.description)
                  setTaskPoints(response.data.points)
                  setPickedPlayer(response.data.pickedPlayer)
                  setTaskId(response.data.taskId)
                  return response.data;
              })
              .catch(error => {
                  console.error("Error fetching task:", error);
              });
            }

    };


    const voteTask = (vote, taskId) => {

      
      if (webSocketRef.current) {
          webSocketRef.current.send(JSON.stringify({
              type: 'task_vote',
              taskId: taskId,
              taskVote: vote
          }));
          // Add icons to the respective lists based on the vote
          // if (vote === "yes") {
          //   setCheckmarksLine1(prevCheckmarks => [...prevCheckmarks, <FontAwesomeIcon key={taskId} icon={faCheck} className="ml-2 text-success" />]);
          // } 
    
          // else if (vote === "no") {
          //   setExesLine2(prevExes => [...prevExes, <FontAwesomeIcon key={taskId} icon={faTimes} className="ml-2 text-danger" />]);
          // } 
    
          // else if (vote === "skip") {
          //   setQuestionLine3(prevQuestions => [...prevQuestions, <FontAwesomeIcon key={taskId} icon={faQuestion} className="ml-2 text-warning" />]);
          // }
    
        };
      }
  


  const fetchTask = () => {
    if (webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({
          type: 'new_task'
      }));
  }
  }


  //incoming change, this return is incoming change
    useEffect(() => {
        // Fetch the player list and game when the component mounts
        fetchPlayerList();
        fetchGame();
        
        // Setup WebSocket connection
        const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
        console.log("token being sent:", token)
        webSocketRef.current = new WebSocket(`${wsScheme}//localhost:8000/ws/gamelobby/`);
        
        webSocketRef.current.onopen = (event) => {
            console.log('WebSocket Connected');
        };

        webSocketRef.current.onmessage = (event) => {
            // Handle incoming messages
            const data = JSON.parse(event.data);
            console.log('Message from ws ', data.message);
            console.log('Raw data ', data);
            console.log('Raw event ', event);
            console.log('msg_type ', data.msg_type)
            

            // Websocket response handler
            switch (data.msg_type) {
                case 'disconnect':
                    console.log("player disconnected");
                    console.log(data.message);
                    setPlayerList(prevPlayerList => {
                        return prevPlayerList.filter(player => player.username !== data.message);
                    });

                    if (data.admin) {
                      console.log("Admin has quit, game is deleted")
                      navigate('/')
                    }

                    break;
                case 'join':
                    console.log("player joined");
                    console.log("Updating list");
                    setPlayerList(prevPlayerList => {
                        console.log("previous player list: ", prevPlayerList);
                        const existingPlayer = prevPlayerList.find(p => p.username === data.message.username);
                        if (existingPlayer) {
                            console.log("update player");
                            // Player exists, update their score
                            return prevPlayerList.map(p => 
                                p.username === data.message.username ? { ...p, score: data.message.score } : p
                            );
                        } else {
                            console.log("adding player: ", data.message);
                            // New player, add to the list
                            return [...prevPlayerList, data.message];
                        }
                    });
                    
                    break;
                    
                case 'new_task':
                    setTaskId(data.message['taskId']);
                    setTaskText(data.message['taskText']);
                    setTaskPoints(data.message['taskPoints']);
                    setPickedPlayer(data.message['pickedPlayer']);
                    setGameStarted(data.message['gameStarted']);
                    setPlayerList(data.message['participants']);
                    console.log("NEW TASK TESTING PLAYERLIST: ", playerList);
                    break;
                
                case 'task_done':
                    setYesVotes(0)
                    setNoVotes(0)
                    setSkipVotes(0)
                    setCheckmarksLine1([])
                    setExesLine2([])
                    setQuestionLine3([])
                    setTotalVotes(0)
                      
                    // Task done should only reset the useStates
                    // setTaskId(data.message['taskId']);
                    // setTaskText(data.message['taskText']);
                    // setTaskPoints(data.message['taskPoints']);
                    // setPickedPlayer(data.message['pickedPlayer']);
                    // setGameStarted(data.message['gameStarted']);
                    // setPlayerList(data.message['participants']);
                    break;

                case 'task_new_vote':

                    console.log("new vote recieved")
                    // console.log("Yes votes: ", data.message['yesVotes'])
                    // console.log("no votes: ", data.message['noVotes'])
                    // console.log("skip votes: ", data.message['skipVotes'])
                    // setYesVotes(data.message['yesVotes'])
                    // setNoVotes(data.message['noVotes'])
                    // setSkipVotes(data.message['skipVotes'])

                    // prevVote only exists if we need to change a vote
                    const newVote = data.message['prevVote']
                    var vote = data.message['newVote'];

                    
                    console.log("newVote value, ", newVote);
                    console.log("prevVote value, ", data.message['prevVote']);
                    console.log("newVote value, ", data.message['newVote']);

                    if (newVote != undefined) {
                      console.log("change vote detected")
                      const prevVote = data.message['prevVote'];

                      const removeVote = (voteType) => {
                        switch (voteType) {
                          case 'yes':
                            console.log("Removing a yes vote");
                            setCheckmarksLine1(prevCheckmarks => prevCheckmarks.slice(0, -1));
                            break;
                          case 'no':
                            console.log("Removing a no vote");
                            setExesLine2(prevExes => prevExes.slice(0, -1));
                            break;
                          case 'skip':
                            console.log("Removing a skip vote");
                            setQuestionLine3(prevQuestions => prevQuestions.slice(0, -1));
                            break;
                          default:
                            console.error("Unhandled vote type:", voteType);
                        }
                      };
                      console.log("new vote is", vote)
                      // Call removeVote with previous vote to remove the appropriate item
                      removeVote(prevVote);

                    }
                    else {
                      console.log("new vote detected", vote)
                      setTotalVotes(prevTotalVotes => prevTotalVotes + 1);
                    }

                    console.log(vote)
                    switch (vote) {
                      case 'yes':
                        console.log("yes vote registered")
                        setCheckmarksLine1(prevCheckmarks => [...prevCheckmarks, <FontAwesomeIcon key={taskId} icon={faCheck} className="ml-2 text-success" />]);
                        break;
                      case 'no':
                        console.log("no vote registered")
                        setExesLine2(prevExes => [...prevExes, <FontAwesomeIcon key={taskId} icon={faTimes} className="ml-2 text-danger" />]);
                        break;
                      default:
                        console.log("skip vote registered")
                        setQuestionLine3(prevQuestions => [...prevQuestions, <FontAwesomeIcon key={taskId} icon={faQuestion} className="ml-2 text-warning" />]);
                        break;
                    }


                  
                  break;

                case 'game_end':
                    console.log("game end message recieved from WS")

                    console.log("GAME HAS ENDED")

                    navigate("/");

                  break;
            }
        
        };

        webSocketRef.current.onclose = () => {
            console.log('WebSocket Disconnected');
        };

        // Clean up on unmount
        return () => {
            webSocketRef.current.close();
        };

    }, []);


    return (
        <div className="game-lobby">
          <div className="Username">Username: {username}</div>
          <div className="GameID">GameID: {gameID}</div>
          {/* Leaderboard */}

          {/* Display total votes count */}
          <div className="game-lobby">
            <div className="vote-count">
              <h3>Total votes: {totalVotes}</h3>
              {/* <p>Yes votes: {yesVotes}</p>
              <p>No votes: {noVotes}</p>
              <p>Skip votes: {skipVotes}</p> */}
          {/* Display checkmarks for "Yes" votes */}
          <div>
              {checkmarksLine1.map((checkmark, index) => (
              <span key={index}>{checkmark}</span>
            ))}
          </div>

          {/* Display X's for "No" votes */}
          <div>
            {exesLine2.map((ex, index) => (
              <span key={index}>{ex}</span>
            ))}
        </div>
  
        {/* Display question's for "Skip" votes */}
          <div>
            {questionLine3.map((question, index) => (
              <span key={index}>{question}</span>
            ))}
          </div>
        </div>


        </div>

          <div className="leaderboard card position-fixed top-10 p-3">
            <h2 className="card-header text-center">Leaderboard</h2>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {/* Display leaderboard content here */}
                {/* Map through players array to display each player and their score */}
                {playerList.map((player, index) => (
                  <div
                    className="list-group-item d-flex align-items-center justify-content-start"
                    key={index}>
                    <span className="me-2">{player.username}</span>
                    <span className="badge bg-secondary ms-auto me-3">
                      {player.score}
                    </span>
                    
                  </div>
                ))}
              </div>
            </div>
          </div>
    
          <div className="questions-container">
  <div className="group-question">
    <h2 className="font-style-prompt">Challenge</h2>
    <p className="font-style">{pickedPlayer}'s task</p>
    <p className="font-style">Points: {taskPoints}</p>
    <p className="font-style">task: {taskText}</p>


    {pickedPlayer != username && taskText && (
      <div>

        <button
          className="yes-button btn btn-sm btn-primary"
          onClick={() => voteTask( "yes", taskId)}
        >
          Yes
          
        </button>
        <button
        
          className="no-button btn btn-sm btn-danger"
          onClick={() => voteTask("no", taskId)}
        >
          No
        </button>
        <button
          className="undecided-button btn btn-sm btn-warning"
          onClick={() => voteTask("skip", taskId)}
        >
          Skip
        </button>
        
      </div>
    )}
  </div>
</div>
    

          <button
            className="endGame-button"
            onClick={admin ? handleDelete : handleLeave}
          >
            {admin ? "End game" : "Leave game"}
          </button>
    
          {admin && !gameStarted && ( // Only render the button if the user is an admin
            <button 
              className="fetchTask-button" 
              onClick={fetchTask}
            >
              Start Game
            </button>
          )}
          {/* WE NEED TO FIX THE Z VALUES OF THESE BEFORE WE COMMENT THEM IN AGAIN*/}
          {/* {<div className="wave wave1"></div>} */}
          {/* {<div className="wave wave2"></div>} */}
          {/* {<div className="wave wave3"></div>} */}
        </div>
      );
    
}

export default GameLobby;
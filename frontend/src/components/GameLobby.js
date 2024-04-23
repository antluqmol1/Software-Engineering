import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import axios from "axios";
import Cookies from "universal-cookie";
import "../styles/GameLobby.css";
import "../styles/App.css";
import "bootstrap/dist/css/bootstrap.min.css"; 
import { Wheel } from 'react-custom-roulette'


const wheel_data = [
  // { option: 'bob'},
  // { option: 'alice'},
  // { option: 'frank'},

]

function GameLobby() {
    const [playerList, setPlayerList] = useState([]);
    const [admin, setAdmin] = useState(false);
    const [gameID, setGameID] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [taskText, setTaskText] = useState(null);
    const [spunWheel, setSpunWheel] = useState(false);
    const [taskPoints, setTaskPoints] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [yesVotes, setYesVotes] = useState(0);
    const [noVotes, setNoVotes] = useState(0);
    const [skipVotes, setSkipVotes] = useState(0);
    const [pickedPlayer, setPickedPlayer] = useState(null);
    const [nextTask, setNextTask] = useState(false)
    const navigate = useNavigate();
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");
    const webSocketRef = useRef(null);
    const [usernameArray, setUsernameArray] = useState([{ option: 'null'}]);


    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);


    const handleDelete = () => {
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

  //   const fetchTask = () => {
  //       axios.get("http://localhost:8000/game/next-task/",
  //           {
  //               headers: {
  //                   "X-CSRFToken": token, // Include CSRF token in headers
  //               },
  //           }
  //       )
  //           .then(response => {
  //               console.log("response: ", response.data.taskId)
  //               if (webSocketRef.current) {
  //                   webSocketRef.current.send(JSON.stringify({
  //                   type: 'new_task',
  //                   taskId: response.data.taskId,
  //                   pickedPlayer: response.data.pickedPlayer,
  //                   gameStarted: true
  //               }));
  //             }
  //               return response.data;
  //           })
  //           .catch(error => {
  //               console.error("Error fetching task:", error);
  //           });
  //   };

  // Function to fetch the list of participants from the server
  const fetchPlayerList = () => {
    axios.get("http://localhost:8000/get-game-participants/", {
        headers: {
          "X-CSRFToken": token, // Include CSRF token in headers
        },
      })
      .then((response) => {
        setPlayerList(response.data.participants);
        const usernames = Array.from(response.data.participants.values()).map(player => ({ option: player.username }));
        setUsernameArray(usernames);

        console.log('Username array:', usernames);
        console.log('Username array2222:', wheel_data);

      })
      .catch((error) => {
        console.error("Error fetching player list:", error);
      });
  };

  useEffect(() => {
    console.log('uuuuuuuusseeeerrr22222222222: ', usernameArray);
  }, [usernameArray]);

  // useEffect(() => {

  //     const usernames = Array.from(playerList.values()).map(player => ({ option: player.username }));
  //     setUsernameArray(Array.from(playerList.values()).map(player => ({ option: player.username })));
  //     console.log("USEEEEERNAMES", usernameArray)

  // }, [playerList]);

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
          })
          .catch(error => {
              console.error("Error fetching game ID:", error);
          });

          // Condition to fetch the current task if the game is started
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
                return response.data;
            })
            .catch(error => {
                console.error("Error fetching task:", error);
            });
          }

    };

  //   // Function assigns points to player in database, needs to be called by button on website
  //   const givePoints = (username, points) => {
  //       axios
  //       .put(
  //           "http://localhost:8000/game/give-points/",
  //           { 
  //               username: username, 
  //               points: points 
  //           },
  //           {
  //               headers: {
  //                   "X-CSRFToken": token, // Include CSRF token in headers
  //               },
  //           }
  //       )
  //       .then((response) => {
  //           if (response.data['success'] === true) {
  //           }
  //           else {
  //               console.log("failed to give points");
  //           }

  //       return response.data;
  //     })
  //     .catch((error) => {
  //       console.error("Error assigning points:", error);
  //       return null;
  //     });
  // };

  // const taskDone = () => {
  //   if (webSocketRef.current) {
  //       webSocketRef.current.send(JSON.stringify({
  //           type: 'task_done', 
  //           // taskText: taskText,
  //           // taskPoints: taskPoints,
  //           taskId: taskId
  //       }));
  //   }

  // }

  const voteTask = (vote, taskId) => {
    if (webSocketRef.current) {
        webSocketRef.current.send(JSON.stringify({
            type: 'task_vote',
            taskId: taskId,
            taskVote: vote
        }));
    }
  }

  const fetchTask = () => {

    if (webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({
          type: 'new_task'
      }));
  }
  }
  const getNextTask = () => {

    if (webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({
          type: 'new_task'
      }));
  }
  }

  // Log the updated playerList within a useEffect hook
  useEffect(() => {
    console.log('Updating userNameArray', playerList.size)
    if (playerList.length > 0) {
      console.log('LISSSSSSSTTTTfakookaokgoTT: ', playerList);
      const usernames = Array.from(playerList.values()).map(player => ({ option: player.username }));
      setUsernameArray(usernames);
    }

  }, [playerList]);


  //incoming change, this return is incoming change
    useEffect(() => {
        // Fetch the player list and game when the component mounts
        fetchPlayerList();
        fetchGame();
        
        // Setup WebSocket connection
        const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
        console.log("token being sent:", token)
        webSocketRef.current = new WebSocket(`${wsScheme}//localhost:8000/ws/gamelobby/`);
        
        // WE NEED TO EDIT THE LOGIN VIEW, WE MUST GENERATE A JWT ON THE BACKEND AND SEND IT TO THE BROWSER
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

                    break;
                case 'join':
                    console.log("player joined");
                    console.log("Updating list: ", playerList);
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
                    // Update the list of usernames as well

                    break;
                    
                case 'new_task':
                    console.log('player list from socket rqu8rqeouqo: ', data.message['participants'])
                    setTaskId(data.message['taskId']);
                    setTaskText(data.message['taskText']);
                    setTaskPoints(data.message['taskPoints']);
                    setPickedPlayer(data.message['pickedPlayer']);
                    setGameStarted(data.message['gameStarted']);
                    handleSpinClick(data.message['pickedPlayer'], data.message['participants']);
                    break;
                
                case 'task_done':
                    setYesVotes(0)
                    setNoVotes(0)
                    setSkipVotes(0)

                    // setNextTask(true);
                    setSpunWheel(false);
                    setNextTask(true);

                    setTaskId(data.message['taskId']);
                    setTaskText(data.message['taskText']);
                    setTaskPoints(data.message['taskPoints']);
                    setPickedPlayer(data.message['pickedPlayer']);
                    setGameStarted(data.message['gameStarted']);
                    setPlayerList(data.message['participants']);

                    break;

                case 'task_new_vote':
                    setYesVotes(data.message['yesVotes'])
                    setNoVotes(data.message['noVotes'])
                    setSkipVotes(data.message['skipVotes'])
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


    const handleSpinClick = (username, usernames) => {
      if (!mustSpin) {

        const newPrizeNumber = Math.floor(Math.random() * wheel_data.length);
        
        console.log('USEEEEERNAMEEEMEME', username)
        console.log('plaaaaaayyyeerList: ', usernameArray)
        console.log('plaaaaaayyyeerList425364534334: ', usernames)

        const index = usernames.findIndex(player => player.username === username);
        
        console.log('Prizeee number: ', index)

        setPrizeNumber(index);
        setMustSpin(true);
        console.log(spunWheel)
        console.log('plaaaayerLLIIIIISSSTTTT',playerList)
            // Set up a setTimeout to change the state back to false after 7 seconds
          setTimeout(() => {
            console.log(spunWheel)
            setSpunWheel(true);
          }, 12000);
      }
    }



    return (
        <div className="game-lobby">
          <div className="GameID">GameID: {gameID}</div>
          {/* Leaderboard */}
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

{spunWheel &&
      <div className="questions-container">
        <div className="group-question">
              <h2 className="font-style-prompt">Challenge</h2>
              <p className="font-style">{pickedPlayer}'s task</p>
              <p className="font-style">Points: {taskPoints}</p>
              <p className="font-style">task: {taskText}</p>
    <p className="font-style" style={{fontSize: 'smaller'}}>Yes: {yesVotes}</p>
    <p className="font-style" style={{fontSize: 'smaller'}}>No: {noVotes}</p>
    <p className="font-style" style={{fontSize: 'smaller'}}>skip: {skipVotes}</p>

        
    {taskText && 
    
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
    }
        </div>
      </div>
}
    
          <button
            className="endGame-button"
            onClick={admin ? handleDelete : handleLeave}
          >
            {admin ? "End game" : "Leave game"}
          </button>
          
          {admin && nextTask && (
            <button 
            className="fetchTask-button" 
            onClick={getNextTask}
          >
            Next Challenge
          </button>
          )}


    
          {admin && !gameStarted && ( // Only render the button if the user is an admin
            <button 
              className="fetchTask-button" 
              onClick={fetchTask}
            >
              Start Game
            </button>
          )}
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
          <div className="wave wave3"></div>
        
        { !spunWheel &&
          <div className='roulette-wheel'>
              
            <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={usernameArray}
            backgroundColors={['#a35cb5', '#c971d9', '#c251d6']}
            textColors={['white']}
            onStopSpinning={() => {
              setMustSpin(false);
            }}
            />
            {/* <button onClick={handleSpinClick}>SPIN</button> */}
            </div>
          }

        
        </div>
      );
    
}

export default GameLobby;
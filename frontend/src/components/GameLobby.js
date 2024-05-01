import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import axios from "axios";
import Cookies from "universal-cookie";
import "../styles/GameLobby.css";
import "../styles/App.css";
import "bootstrap/dist/css/bootstrap.min.css"; 
import { AuthContext } from '../AuthContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faQuestion } from "@fortawesome/free-solid-svg-icons";
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
    const [totalVotes, setTotalVotes] = useState(0); // New state for total votes
    const [nextTask, setNextTask] = useState(false)
    const navigate = useNavigate();
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");
    const webSocketRef = useRef(null);
    const [checkmarksLine1, setCheckmarksLine1] = useState([]);
    const [exesLine2, setExesLine2] = useState([]);
    const [questionLine3, setQuestionLine3] = useState([]);

    const { loading, username, inAGame, setInAGame } = useContext(AuthContext);
    const [usernameArray, setUsernameArray] = useState([{ option: 'null'}]);


    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);


    /*

    BUGS!:

    When a player joins when challenge is active, they don't get the voting
    screen. If a player leaves mid vote, you could end up softlocked, because 
    he is counted as a particiant as of the last vote, but can't vote when leaving.
    Points are not updated until next task is fetched, I have added a comment in task_done 
    send message in consumers.py that explains what we need to do accordint to current implementation

    1. We need to fix some useState checks to ensure the player gets the right information.
      Perhaps in connect, we can check for game is started, or query PickedTask for done = false
    2. We need to make it so that player disconnect triggers a reevaluation of the votes
    3. Return a participants list, or simply a player participant + updated score when a vote is complete

    */


    const handleDelete = () => {  

      console.log("Ending/Deleting game...")
      webSocketRef.current.close(1000, 'Admin ended game');
      setInAGame(false)
      navigate("/")

  };

    // Request to backend for leaving game(removing player from DB).
    const handleLeave = () => {

      console.log("Leaving game...")
      webSocketRef.current.close(1000, 'Player left the game');
      setInAGame(false)
      navigate("/")
      
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
              
              const taskData = response.data["activeTask"]
              if (!response.data["activeTask"]) {
                setNextTask(false)
                console.log(response.data["activeTask"])
              } else {
                setTaskText(taskData.description)
                setTaskPoints(taskData.points)
                setPickedPlayer(taskData.pickedPlayer)
                setTaskId(taskData.taskId)
              }
              console.log("fetch game response: ", response.data)
              console.log("isAdmin: ", response.data["isAdmin"])
              console.log("activeTask: ", response.data["activeTask"])
              // setUsername(response.data['username']);
          })
          .catch(error => {
              console.error("Error fetching game ID:", error);
          });

          // Condition to fetch the current task if the game is started
            // Im confused, why do we fetch current task if the game is NOT started???
          if (gameStarted) {
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
  


  const startGame = () => {

    if (webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({
          type: 'new_task'
      }));
  }
  }
  const getNextTask = () => {

    setNextTask(true)

    if (webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({
          type: 'new_task'
      }));
  }
  }

  // Update player list function
  const updatePlayerList = (playerData) => {
    setPlayerList(prevPlayerList => {
      const existingPlayerIndex = prevPlayerList.findIndex(p => p.username === playerData.username);
      if (existingPlayerIndex !== -1) {
        // Player exists, update their data
        return prevPlayerList.map((player, index) => 
          index === existingPlayerIndex ? { ...player, ...playerData } : player
        );
      } else {
        // New player, add to the list
        return [...prevPlayerList, playerData];
      }
    });
  };
  

  // Log the updated playerList within a useEffect hook
  useEffect(() => {
    console.log('Updating userNameArray', playerList.size)
    console.log("logged in? ", inAGame)
    if (playerList.length > 0) {
      const usernames = Array.from(playerList.values()).map(player => ({ option: player.username }));
      setUsernameArray(usernames);
    }

  }, [playerList]);


  //incoming change, this return is incoming change
    useEffect(() => {



        // new loaing state makes sure we don't perform actions before the right values are set
        if (!loading && !inAGame) {
          console.log("You're not in a game, returning to home screen");
          navigate("/");
        }

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
                    console.log("IRJIGJRIJGRIJI Picked from Newtask: ", data.message['pickedPlayer'])

                    setTaskId(data.message['taskId']);
                    setTaskText(data.message['taskText']);
                    setTaskPoints(data.message['taskPoints']);
                    setPickedPlayer(data.message['pickedPlayer']);
                    setGameStarted(data.message['gameStarted']);
                    console.log(data.message['pickedPlayer'])
                    console.log(data.message['participants'])
                    handleSpinClick(data.message['pickedPlayer'], data.message['participants']);
                    setPlayerList(data.message['participants']);
                    console.log("NEW TASK TESTING PLAYERLIST: ", playerList);
                    const sortedPlayerList = data.message.participants.sort((a, b) => b.score - a.score);
                    setPlayerList(sortedPlayerList);
                    break;
                
                case 'task_done':
                    // setYesVotes(0)
                    // setNoVotes(0)
                    // setSkipVotes(0)
                    console.log(data.message)
                    setCheckmarksLine1([])
                    setExesLine2([])
                    setQuestionLine3([])
                    setTotalVotes(0)
                    
                    console.log("HEEEEEELLLOLOLOLOLOLOLO Picked from done: ", data.message['pickedPlayer']);
                    console.log("prev task user: ", data.message['username'], " new score ", data.message['score']);
                    
                    if (data.message['winner'] == true) {
                      console.log("player has won, playerlist with new score")
                      updatePlayerList(data.message['player&score'])
                    }

                    setSpunWheel(false);
                    setNextTask(true); // true? should we not set it to false

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


                              // Websocket response handler

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
            // commented out as of now, because we are sending close message when ending or leaving
            // Otherwise we are not to leave the game
            webSocketRef.current.close(4001, "navigated away");
        };

    }, []);


    const handleSpinClick = (username, usernames) => {
      if (!mustSpin) {

        const newPrizeNumber = Math.floor(Math.random() * wheel_data.length);
        const index = usernames.findIndex(player => player.username === username);
        
        console.log('Handle spin click')

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

{spunWheel &&
      <div className="questions-container">
        <div className="group-question">
              <h2 className="font-style-prompt">Challenge</h2>
              <p className="font-style">{pickedPlayer}'s task</p>
              <p className="font-style">Points: {taskPoints}</p>
              <p className="font-style">task: {taskText}</p>


        
    {pickedPlayer != username && taskText && 
    
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
          
          {admin && gameStarted && nextTask && (
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
              onClick={startGame}
            >
              Start Game
            </button>
          )}
          {/* WE NEED TO FIX THE Z VALUES OF THESE BEFORE WE COMMENT THEM IN AGAIN*/}
          {/* {<div className="wave wave1"></div>} */}
          {/* {<div className="wave wave2"></div>} */}
          {/* {<div className="wave wave3"></div>} */}
        
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
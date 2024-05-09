import { QuestionContainer } from './QuestionContainer';
import { Leaderboard } from './Leaderboard';
import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import axios from "axios";
import Cookies from "universal-cookie";
import "../styles/GameLobby.css";
import "../styles/App.css";
import "bootstrap/dist/css/bootstrap.min.css"; 
import { AuthContext } from '../AuthContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faQuestion, } from "@fortawesome/free-solid-svg-icons";
import { Wheel } from 'react-custom-roulette'
import SpinSound from '../assets/Sounds/SpinWheel.wav'; // Import your sound file


const wheel_data = [
  // { option: 'bob'},
  // { option: 'alice'},
  // { option: 'frank'},
]

function GameLobby() {
    const [playerList, setPlayerList] = useState([]);
    const { loading, username, inAGame, setInAGame } = useContext(AuthContext);
    const [usernameArray, setUsernameArray] = useState([{ option: 'null'}]);

    const [admin, setAdmin] = useState(false);
    const [gameID, setGameID] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [taskText, setTaskText] = useState(null);
    const [taskPoints, setTaskPoints] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [pickedPlayer, setPickedPlayer] = useState(null);
    const [totalVotes, setTotalVotes] = useState(0); // New state for total votes

    const [spunWheel, setSpunWheel] = useState(false);
    const [waitingForSpin, setWaitingForSpin] = useState(false);
    const [nextTask, setNextTask] = useState(false)
    
    const [checkmarksLine1, setCheckmarksLine1] = useState([]);
    const [exesLine2, setExesLine2] = useState([]);
    const [questionLine3, setQuestionLine3] = useState([]);
    const [showLeaderBoard, setShowLeaderBoard] = useState(true);
    const [wheelAudio, setWheelAudio] = useState(new Audio(SpinSound));

    const navigate = useNavigate();
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");
    const webSocketRef = useRef(null);

    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);


    const handleDelete = () => {  

      console.log("Ending/Deleting game...")
      webSocketRef.current.close(1000, 'Admin ended game');
      setInAGame(false)
      navigate("/end-game")

  };

    // Request to backend for leaving game(removing player from DB).
    const handleLeave = () => {

      console.log("Leaving game...")
      webSocketRef.current.close(1000, 'Player left the game');
      setInAGame(false)
      navigate("/end-game")
      
  };
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
  }, [usernameArray]);


  const fetchGame = () => {

    

      axios.get("http://localhost:8000/get-game/",
          {
              headers: {
                  "X-CSRFToken": token, // Include CSRF token in headers
              },
          })
          .then(response => {

              console.log("is spinning = ", response.data["isSpinning"])
              if (response.data["isSpinning"]) {
                console.log("waitingForSpin now set true")
                setWaitingForSpin(true);
              } else {
                console.log("waitingForSpin NOT SET!")
              }

              setAdmin(response.data["isAdmin"]);
              setGameID(response.data["gameId"]);
              setGameStarted(response.data["gameStarted"]);
              
              const taskData = response.data["activeTask"]
              if (!response.data["activeTask"]) {
                console.log("no active task")
                setSpunWheel(false)
                setNextTask(true)
                console.log(response.data["activeTask"])
              } else {
                console.log("no active task")
                setSpunWheel(true)
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

    setNextTask(false)
    console.log("playerList can not be updated")
    if (webSocketRef.current) {
      webSocketRef.current.send(JSON.stringify({
          type: 'new_task'
      }));
  }
  }

  // Update player list function
  const updatePlayerList = (playerData) => {
    console.log("updating player list...")
    setPlayerList(prevPlayerList => {
      const existingPlayerIndex = prevPlayerList.findIndex(p => p.username === playerData.username);
      if (existingPlayerIndex !== -1) {
        // Player exists, update their data
        console.log("player exists, update their data")
        return prevPlayerList.map((player, index) => 
          index === existingPlayerIndex ? { ...player, ...playerData } : player
        );
      } else {
        // New player, add to the list
        console.log("player doesnt exists, add them")
        return [...prevPlayerList, playerData];
      }
    });
  };

  // Log the updated playerList within a useEffect hook
  useEffect(() => {

    // Don't update the username Array when wheel is spinning
    if (mustSpin === true) {
      return;
    }

    console.log('Updating userNameArray', playerList)
    console.log("logged in? ", inAGame)
    if (playerList.length > 0) {
      const usernames = Array.from(playerList.values()).map(player => ({ option: player.username }));
      setUsernameArray(usernames);
    }

  }, [playerList]);


  //incoming change, this return is incoming change
    useEffect(() => {
        
      console.log('HAHHAHAHHAALALLALALA SOUND LOAD')
      const audio = new Audio(SpinSound)
      console.log(audio)
        setWheelAudio(audio)


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
            // console.log('Raw data ', data);
            // console.log('Raw event ', event);
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
                    console.log("Can we update player list? ", mustSpin ? "yes" : "no");
                    console.log("Updating list: ", playerList);
                    setPlayerList(prevPlayerList => {
                        console.log("previous player list: ", prevPlayerList);
                        const existingPlayerIndex = prevPlayerList.findIndex(p => p.username === data.message.username);
                        if (existingPlayerIndex !== -1) {
                            const existingPlayer = prevPlayerList[existingPlayerIndex];
                            if (existingPlayer.score !== data.message.score) {
                              console.log("update player");
                              return prevPlayerList.map(p => 
                                  p.username === data.message.username ? { ...p, score: data.message.score } : p
                              );
                            } else {
                              console.log("not updating player");
                              return prevPlayerList;
                            }
                            // Player exists, update their score
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
                    setNextTask(false)
                    console.log(data.message['pickedPlayer'])
                    console.log(data.message['participants'])
                    handleSpinClick(data.message['pickedPlayer'], data.message['participants']);
                    setPlayerList(data.message['participants']);
                    console.log("NEW TASK TESTING PLAYERLIST: ", playerList);
                    const sortedPlayerList = data.message.participants.sort((a, b) => b.score - a.score);
                    setPlayerList(sortedPlayerList);
                    console.log("Wheeel audio", wheelAudio)
                    wheelAudio.play()
                    break;
                
                case 'task_done':
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
                    } else {
                      console.log("player has not won, not updating playerlist")
                    }

                    setSpunWheel(false);
                    setNextTask(true); // true? should we not set it to false

                    break;

                case 'task_new_vote':

                    console.log("new vote recieved")
                  

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

                    navigate("/end-game");

                  break;
                case 'wheel_stopped':
                  console.log("wheel_stopped message")
                  console.log("current waitingForSpin, ", waitingForSpin)
                  if (!waitingForSpin) {
                    console.log("setting to false")
                    setWaitingForSpin(false);
                  } else {
                    console.log("waitingForSpin did not change state...")
                  }
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
        console.log('Handle spin click')

        const newPrizeNumber = Math.floor(Math.random() * wheel_data.length);
        const index = usernames.findIndex(player => player.username === username);
        
        setPrizeNumber(index);
        setMustSpin(true);
        console.log(spunWheel)
        console.log('plaaaayerLLIIIIISSSTTTT',playerList)
            // Set up a setTimeout to change the state back to false after 7 seconds
          const endTime = Date.now() + 12000;
          localStorage.setItem('wheelEndTime', endTime);
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

          {/* Display total votes count */}
          <div className="game-lobby">
            <div className="vote-count">
              <h3 className="tVotes">Total votes: {totalVotes}</h3>
              {/* <p>Yes votes: {yesVotes}</p>
              <p>No votes: {noVotes}</p>
              <p>Skip votes: {skipVotes}</p> */}
          {/* Display checkmarks for "Yes" votes */}
          <div>
              {checkmarksLine1.map((checkmark, index) => (
              <span className="single-vote" key={index}>{checkmark}</span>
            ))}
          </div>

          {/* Display X's for "No" votes */}
          <div>
            {exesLine2.map((ex, index) => (
              <span className="single-vote" key={index}>{ex}</span>
            ))}
          </div>
  
            {/* Display question's for "Skip" votes */}
            <div>
              {questionLine3.map((question, index) => (
                <span className="single-vote" key={index}>{question}</span>
              ))}
            </div>
        </div>
      </div>


<Leaderboard   handleLeaderBoardShow={handleLeaderBoardShow} showLeaderBoard={showLeaderBoard} playerList={playerList}/>

{spunWheel &&
<QuestionContainer   waitingForSpin={waitingForSpin} pickedPlayer={pickedPlayer} taskPoints={taskPoints} taskText={taskText} username={username} voteTask={voteTask} taskId={taskId}  />
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
            onClick={getNextTask}> 
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
     
        
        { !spunWheel &&
          <div className='roulette-wheel'>
              
            <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={usernameArray}
            // spinDuration={1.2}
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
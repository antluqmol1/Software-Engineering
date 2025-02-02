import { QuestionContainer } from './QuestionContainer';
import { Leaderboard } from './Leaderboard';
import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import Cookies from "universal-cookie";
import "../styles/GameLobby.css";
import "../styles/App.css";
import "bootstrap/dist/css/bootstrap.min.css"; 
import { AuthContext } from '../AuthContext';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes, faQuestion, } from "@fortawesome/free-solid-svg-icons";
import { Wheel } from 'react-custom-roulette'
import SpinSound from '../assets/Sounds/SpinWheel.wav'; // Import your sound file
import gameServices from "../services/gameServices";
import PolkadotBackground from './PolkadotBackground';

function GameLobby() {
    
    //Used in the leaderboard
    const [playerList, setPlayerList] = useState([]); //list of players in a game

    //States of the game
    const [admin, setAdmin] = useState(false);
    const [gameID, setGameID] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);

    //task related states
    const [taskText, setTaskText] = useState(null);
    const [taskPoints, setTaskPoints] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [totalVotes, setTotalVotes] = useState(0); // New state for total votes
    const [nextTask, setNextTask] = useState(false)
    
    //Lists for different types of votes
    const [checkmarksLine1, setCheckmarksLine1] = useState([]);
    const [exesLine2, setExesLine2] = useState([]);
    const [questionLine3, setQuestionLine3] = useState([]);
    
    const navigate = useNavigate();
    
    //context variables
    const { loading, username, inAGame, setInAGame, userIsLoggedIn, csrfToken } = useContext(AuthContext);
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");
    const webSocketRef = useRef(null);
    
    //Roulette wheel related states
    const [wheelData, setWheelData] = useState([{ oprtion: 'null', uri: 'null'}]);
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);
    const [spunWheel, setSpunWheel] = useState(false);
    const [waitingForSpin, setWaitingForSpin] = useState(false); //state for handling joinning mid game
    const wheelAudio = new Audio(SpinSound); //Audio effect for wheel
    const [pickedPlayer, setPickedPlayer] = useState(null); //who will recieve the next task
    
    //Playlist debug
    useEffect(() => {
      //Sort the leaderboard
    }, [playerList]);
    
    //function to Delete game
    const handleDelete = () => {  
      if (webSocketRef.current) {
        webSocketRef.current.send(JSON.stringify({
          type: 'game_end',
        }));
      };

      webSocketRef.current.close(4020, 'Admin ended game');
      setInAGame(false)
      navigate("/end-game", { state: { playerList } })
      
    };

    // Request to backend for leaving game(removing player from DB).
    const handleLeave = () => {
      webSocketRef.current.close(1000, 'Player left the game');
      setInAGame(false)
      navigate("/")
      
    };


  // Function to fetch the list of participants from the server
  const fetchPlayerList = async () => {
    const response = await gameServices.getParticipants(token);
    if (response.status === 200) {
      setPlayerList(response.data.participants);
    } else {
      console.error("Error fetching participants:", response);
    }
  };

  const fetchPlayerImages = async() => {

    //Fetch list from backend
    const response = await gameServices.getProfilePictures();
    
    //setting list with option and image uri if they are in a custom folder
    const newData = Object.entries(response.data.uris).map(([username, uri]) => (

      {
        option: username,
        image: uri.includes('custom') ? { uri: uri } : null
      }
    ));

    setWheelData(newData)
  }

  //Function to fetch game
  const fetchGame = async () => {
    try {
      const gameResponse = await gameServices.getGame(token);
      if (gameResponse.data["isSpinning"]) {
        setWaitingForSpin(true);
      } else {
        console.log("waitingForSpin NOT SET!");
      }
  
      setAdmin(gameResponse.data["isAdmin"]);
      setGameID(gameResponse.data["gameId"]);
      setGameStarted(gameResponse.data["gameStarted"]);
  
      const taskData = gameResponse.data["activeTask"];
      if (!gameResponse.data["activeTask"]) {
        setSpunWheel(false);
        setNextTask(true);
      } else {
        setSpunWheel(true);
        setTaskText(taskData.description);
        setTaskPoints(taskData.points);
        setPickedPlayer(taskData.pickedPlayer);
        setTaskId(taskData.taskId);
      }
    } catch (error) {
      console.error("Error fetching game ID:", error);
    }
  
    // Condition to fetch the current task if the game is started
    if (gameStarted) {
      try {
        const taskResponse = await gameServices(token);
  
        setTaskText(taskResponse.data.description);
        setTaskPoints(taskResponse.data.points);
        setPickedPlayer(taskResponse.data.pickedPlayer);
        setTaskId(taskResponse.data.taskId);
        return taskResponse.data;
      } catch (error) {
        console.error("Error fetching task:", error);
      }
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

    // NOT WORKING, FIX
    useEffect (() => {

      if (!loading && !userIsLoggedIn) {
        navigate("/")
      }else {
        console.log("In a game")
      }
  
    }, [loading, userIsLoggedIn]); 
  

  // Log the updated playerList within a useEffect hook
  useEffect(() => {

    // Don't update the username Array when wheel is spinning
    if (mustSpin === true) {
      return;
    }
    
    fetchPlayerImages(token)


  }, [playerList]);


  //incoming change, this return is incoming change
    useEffect(() => {

        // new loaing state makes sure we don't perform actions before the right values are set
        if (!loading && !inAGame) {
          navigate("/");
        }

        // Fetch the player list and game when the component mounts
        fetchPlayerList();
        fetchGame();

        // test, can be removed
        fetchPlayerImages(token);
        
        // Setup WebSocket connection
        const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
        console.log("token being sent:", token)
        webSocketRef.current = new WebSocket(`${wsScheme}//localhost:8000/ws/gamelobby/`);
        
        webSocketRef.current.onopen = (event) => {
            console.log('WebSocket Connected');
        };
        
        // Websocket response handler
        webSocketRef.current.onmessage = (event) => {
            // Handle incoming messages
            const data = JSON.parse(event.data);         

            // Websocket response handler
            switch (data.msg_type) {
                
                //When an existing player disconnects from the game
                case 'disconnect':
                    setPlayerList(prevPlayerList => {
                        return prevPlayerList.filter(player => player.username !== data.message);
                    });

                    break;
                //When a new player joins the game
                case 'join':
                    setPlayerList(prevPlayerList => {
                        const existingPlayerIndex = prevPlayerList.findIndex(p => p.username === data.message.username);
                        if (existingPlayerIndex !== -1) {
                            const existingPlayer = prevPlayerList[existingPlayerIndex];
                            if (existingPlayer.score !== data.message.score) {
                              return prevPlayerList.map(p => 
                                  p.username === data.message.username ? { ...p, score: data.message.score } : p
                              );
                            } else {
                              return prevPlayerList;
                            }
                            // Player exists, update their score
                        } else {
                            // New player, add to the list
                            return [...prevPlayerList, data.message];
                          }
                        });
                    break;
                    
                // fetches new task from backend and handles state changes
                case 'new_task':

                    setTaskId(data.message['taskId']);
                    setTaskText(data.message['taskText']);
                    setTaskPoints(data.message['taskPoints']);
                    setPickedPlayer(data.message['pickedPlayer']);
                    setGameStarted(data.message['gameStarted']);
                    setNextTask(false)
                    handleSpinClick(data.message['pickedPlayer'], data.message['participants']);
                    wheelAudio.play()
                    break;
                
                //Re-inits states when one task is done, before next task is fetched
                case 'task_done':
                    setCheckmarksLine1([])
                    setExesLine2([])
                    setQuestionLine3([])
                    setTotalVotes(0)
                    
                    if (data.message['winner'] === true) {
                      updatePlayerList(data.message['player&score'])
                    } else {
                      console.log("player has not won, not updating playerlist")
                    }

                    setSpunWheel(false);
                    setNextTask(true); // true? should we not set it to false

                    break;

                //Handling recieving new votes
                case 'task_new_vote':

                    // prevVote only exists if we need to change a vote
                    const newVote = data.message['prevVote']
                    var vote = data.message['newVote'];

                    if (newVote !== undefined) {
                      const prevVote = data.message['prevVote'];
                      
                      //Remove previous vote if the player had already voted
                      const removeVote = (voteType) => {
                        switch (voteType) {
                          case 'yes':
                            setCheckmarksLine1(prevCheckmarks => prevCheckmarks.slice(0, -1));
                            break;
                          case 'no':
                            setExesLine2(prevExes => prevExes.slice(0, -1));
                            break;
                          case 'skip':
                            setQuestionLine3(prevQuestions => prevQuestions.slice(0, -1));
                            break;
                          default:
                            console.error("Unhandled vote type:", voteType);
                        }
                      };
                      // Call removeVote with previous vote to remove the appropriate item
                      removeVote(prevVote);

                    }
                    else {
                      setTotalVotes(prevTotalVotes => prevTotalVotes + 1);
                    }
                    
                    //Set the new vote to whatever the vote was
                    switch (vote) {
                      case 'yes':
                        setCheckmarksLine1(prevCheckmarks => [...prevCheckmarks, <FontAwesomeIcon key={taskId} icon={faCheck} className="ml-2 text-success" />]);
                        break;
                      case 'no':
                        setExesLine2(prevExes => [...prevExes, <FontAwesomeIcon key={taskId} icon={faTimes} className="ml-2 text-danger" />]);
                        break;
                      default:
                        setQuestionLine3(prevQuestions => [...prevQuestions, <FontAwesomeIcon key={taskId} icon={faQuestion} className="ml-2 text-warning" />]);
                        break;
                    }

                  break;

                case 'game_end':
                    const players = data.message['player_list']
                    setInAGame(false)
                    navigate("/end-game", { state: { playerList: data.message['player_list'] } });
                  break;

                //When the wheel has stopped spinning and everyone recieves the task
                case 'wheel_stopped':
                  if (!waitingForSpin) {
                    setWaitingForSpin(false);
                  } else {
                    console.error("waitingForSpin did not change state...")
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
        const index = usernames.findIndex(player => player.username === username);
        setPrizeNumber(index);
        setMustSpin(true);
          // Set up a setTimeout to change the state back to false after 7 seconds
          const endTime = Date.now() + 12000;
          localStorage.setItem('wheelEndTime', endTime);
          setTimeout(() => {
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
              <h3 className="tVotes">Votes: {totalVotes}/{playerList.length - 1}</h3>
          
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


<Leaderboard endgame={false} playerList={playerList}/>

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
            data={wheelData}
            // spinDuration={1.2}
            backgroundColors={['#a35cb5', '#c971d9', '#c251d6']}
            textColors={['#ffffff']}
            onStopSpinning={() => {
              setMustSpin(false);
            }}
            />
            {/* <button onClick={handleSpinClick}>SPIN</button> */}
            </div>
          }
        <PolkadotBackground></PolkadotBackground>

        
        </div>
      );
    
}

export default GameLobby;
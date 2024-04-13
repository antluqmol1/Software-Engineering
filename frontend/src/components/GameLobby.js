import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import axios from "axios";
import Cookies from "universal-cookie";
import "../styles/GameLobby.css";
import "../styles/App.css";
import "bootstrap/dist/css/bootstrap.min.css";

function GameLobby() {
    const [playerList, setPlayerList] = useState([]);
    const [admin, setAdmin] = useState(false);
    const [gameID, setGameID] = useState(null);
    const [taskText, setTaskText] = useState(null);
    const [taskPoints, setTaskPoints] = useState(null);
    const [GivePointButton, setGivePointButton] = useState(false); // New state
    const navigate = useNavigate();
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");

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

    const fetchTask = () => {
        axios.get("http://localhost:8000/game/next-task/",
            {
                headers: {
                    "X-CSRFToken": token, // Include CSRF token in headers
                },
            }
        )
            .then(response => {
                setGivePointButton(true); // Show the givePoint button again after fetching a new task
                console.log(response.data.description)
                setTaskText(response.data.description)
                setTaskText(response.data.description)
                setTaskPoints(response.data.points)
                return response.data;
            })
            .catch(error => {
                console.error("Error fetching task:", error);
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
        axios.get("http://localhost:8000/get-game/")
            .then(response => {
                setAdmin(response.data["isAdmin"]);
                setGameID(response.data["gameId"]);
                console.log(response.data["gameId"]);
                // setTaskText(response.data["taskText"]);
                // setTaskPoints(response.data["taskPoints"]);
            })
            .catch(error => {
                console.error("Error fetching game ID:", error);
            });
    }

    // Function assigns points to player in database, needs to be called by button on website
    const givePoints = (username, points) => {
        axios
        .put(
            "http://localhost:8000/game/give-points/",
            { 
                username: username, 
                points: points 
            },
            {
                headers: {
                    "X-CSRFToken": token, // Include CSRF token in headers
                },
            }
        )
        .then((response) => {
            if (response.data['success'] === true) {
                setGivePointButton(false); // Hide the givePoint button after clicking
            }
            else {
                console.log("failed to give points");
            }

        return response.data;
      })
      .catch((error) => {
        console.error("Error assigning points:", error);
        return null;
      });
  };

  useEffect(() => {
    // Fetch the player list and game when the component mounts
    fetchPlayerList();
    fetchGame();
  }, []);

  //incoming change, this return is incoming change
    useEffect(() => {
        // Fetch the player list and game when the component mounts
        fetchPlayerList();
        fetchGame();
        
        // Setup WebSocket connection
        const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
        console.log("token being sent:", token)
        const webSocket = new WebSocket(`${wsScheme}//localhost:8000/ws/gamelobby/`);
        // const webSocket = new WebSocket(`wss://localhost:8000/ws/gamelobby/`); # not working

        
        // WE NEED TO EDIT THE LOGIN VIEW, WE MUST GENERATE A JWT ON THE BACKEND AND SEND IT TO THE BROWSER
        webSocket.onopen = (event) => {
            console.log('WebSocket Connected');
        };

        webSocket.onmessage = (event) => {
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
                    
                case 'new-task':
                    console.log("\nnew task recieved\n");
                    break;
            }
        
        };

        webSocket.onclose = () => {
            console.log('WebSocket Disconnected');
        };

        // const sendMessage = (messageContent) => {
        //     if (webSocket) {
        //         webSocket.send(JSON.stringify({
        //             message: messageContent,
        //             type: 'custom_message_type' // This can be any type identifier you need
        //         }));
        //         console.log("Message sent to WS:", messageContent);
        //     } else {
        //         console.error("WebSocket not connected!");
        //     }
        // };
        

        // Clean up on unmount
        return () => {
            webSocket.close();
        };

    }, []);


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
                    key={index}
                  >
                    <span className="me-2">{player.username}</span>
                    <span className="badge bg-secondary ms-auto me-3">
                      {player.score}
                    </span>
                    {GivePointButton && (
                      <button
                        className="givePoint-button btn btn-sm btn-primary"
                        onClick={() => givePoints(player.username, taskPoints)}
                      >
                        Give Points
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
    
          <div className="questions-container">
            <div className="group-question">
              <h2 className="font-style-prompt">Challenge</h2>
              <p className="font-style">
                Points: {taskPoints}
              </p>
              <p className="font-style">
                task: {taskText}
              </p>
            </div>
          </div>
    
          <button
            className="endGame-button"
            onClick={admin ? handleDelete : handleLeave}
          >
            {admin ? "End game" : "Leave game"}
          </button>
    
          <button className="fetchTask-button" onClick={fetchTask}>
            Next challenge
          </button>
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
          <div className="wave wave3"></div>
        </div>
      );
    
}

export default GameLobby;

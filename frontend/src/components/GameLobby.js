import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import axios from "axios";
import Cookies from "universal-cookie";
import '../styles/GameLobby.css';

function GameLobby() {
    const [playerList, setPlayerList] = useState([]);
    const [admin, setAdmin] = useState(false);
    const [gameID, setGameID] = useState(null);
    const [prompt, setPrompt] = useState(null);
    const [promptPoints, setPromptPoints] = useState(null);
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
            if (response.data['success'] == true) {
                console.log("successfully deleted game");
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
    }

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
            if (response.data['success'] == true) {
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
    }

    const fetchPrompt = () => {
        axios.get("http://localhost:8000/game/next-prompt/",
            {
                headers: {
                    "X-CSRFToken": token, // Include CSRF token in headers
                },
            }
        )
            .then(response => {
                setPrompt(response.data['description']);
                setPromptPoints(response.data['points']);
                console.log(prompt);
            })
            .catch(error => {
                console.error("Error fetching prompt:", error);
            });
    };

    // Function to fetch the list of participants from the server
    const fetchPlayerList = () => {
        axios.get("http://localhost:8000/get-game-participants/",
        {
            headers: {
                "X-CSRFToken": token, // Include CSRF token in headers
            },
        }
    )
            .then(response => {
                setPlayerList(response.data.participants);
            })
            .catch(error => {
                console.error("Error fetching player list:", error);
            });
    };

    const fetchGame = () => {
        axios.get("http://localhost:8000/get-game/")
            .then(response => {
                setAdmin(response.data["isAdmin"]);
                setGameID(response.data["gameId"]);
                fetchPrompt();
            })
            .catch(error => {
                console.error("Error fetching game ID:", error);
            });
    }

    // Function assigns points to player in database, needs to be called by button on website
    const givePoints = () => {
        axios
        .put(
            "http://localhost:8000/game/give-points/",
            null,
            {
                headers: {
                    "X-CSRFToken": token, // Include CSRF token in headers
                },
            }
        )
        .then((response) => {
            if (response.data['success'] == true) {
                console.log("succeeded to give points");
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
    }


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
            
            <div className="GameID">
                GameID: {gameID}
            </div>
            {/* Leaderboard */}
            <div className="leaderboard">
                <h2>Leaderboard</h2>
                <div className="leaderboard-players">
                    {/* Display leaderboard content here */}
                    {/* Map through players array to display each player and their score */}
                    {playerList.map((player, index) => (
                        <div className="player" key={index}>
                            <span>{player.username}</span>
                            <span className="score">{player.score}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="questions-container">
                <div className="group-question">
                    <h2 style={{ color: 'black', fontWeight: 'bold' }}>Prompt: </h2>
                    <p style={{ color: 'white' }}>{prompt}</p>
                </div>
            </div>
            
            <button className="endGame-button" onClick={admin ? handleDelete : handleLeave}>
                {admin ? "End game" : "Leave game"}
            </button>

            <button className="fetchPrompt-button" onClick={fetchPrompt}>Fetch Prompt</button>
            {/* <button onClick={() => sendMessage("Hello, this is a test message from the client!")}>
                Send Message to WebSocket
            </button> */}

        </div>
    );

    return (
        <div>
            <div className="GameID">
                GameID: {gameID}
            </div>

            <div className="lobby-container">
                {/* Render participant divs dynamically */}
                {playerList.map((player, index) => (
                    <div className="participant" key={index}>{player.username}</div>
                ))}
            </div>

            <div className="prompt-container">
                <div className="prompt-points">Points: {promptPoints}</div>
                <div className="prompt-text">{prompt}</div>
            </div>
            
           <button className="endGame-button" onClick={admin ? handleDelete : handleLeave}>
                {admin ? "End game" : "Leave game"}
            </button>
            <button className="fetchPrompt-button" onClick={fetchPrompt}>Fetch Prompt</button>
        </div>
    );   
}

export default GameLobby;
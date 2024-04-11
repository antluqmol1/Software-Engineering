import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import axios from "axios";
import Cookies from "universal-cookie";
import '../styles/GameLobby.css';
import '../styles/App.css';

function GameLobby() {
    const [playerList, setPlayerList] = useState([]);
    const [admin, setAdmin] = useState(false);
    const [gameID, setGameID] = useState(null);
    const [prompt, setPrompt] = useState(localStorage.getItem('prompt') || null);
    const [promptPoints, setPromptPoints] = useState(localStorage.getItem('points') || null);
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
                localStorage.removeItem('prompt');
                localStorage.removeItem('points');
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
                localStorage.removeItem('prompt');
                localStorage.removeItem('points');
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
                localStorage.setItem('prompt', response.data['description']); 
                localStorage.setItem('points', response.data['description']);
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
                    <h2 className="font-style-prompt">Prompt</h2>
                    <p className="font-style">Points: {promptPoints} "{prompt}"</p>
                </div>
            </div>
            
            <button className="endGame-button" onClick={admin ? handleDelete : handleLeave}>
                {admin ? "End game" : "Leave game"}
            </button>

            <button className="fetchPrompt-button" onClick={fetchPrompt}>Fetch Prompt</button>
        </div>
    );  
}

export default GameLobby;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import axios from "axios";
import Cookies from "universal-cookie";
import '../styles/GameLobby.css';

function GameLobby() {
    const [showPopup, setShowPopup] = useState(false);
    const [playerList, setPlayerList] = useState([]);
    const [admin, setAdmin] = useState(false);
    const [gameID, setGameID] = useState(null);
    const navigate = useNavigate();
    

    const handleDelete = () => {

        const cookies = new Cookies();
        const token = cookies.get("csrftoken");

        console.log("deleting game, token: ", token);

        // Make a POST request to localhost:8000/delete-game
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

    const handleLeave = () => {

        const cookies = new Cookies();
        const token = cookies.get("csrftoken");

        // Make a POST request to localhost:8000/delete-game
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

    // Function to fetch the list of participants from the server
    const fetchPlayerList = () => {
        axios.get("http://localhost:8000/get-game-participants/")
            .then(response => {
                setPlayerList(response.data.participants);
                console.log(response.data);
            })
            .catch(error => {
                console.error("Error fetching player list:", error);
            });
    };

    const fetchGame = () => {
        axios.get("http://localhost:8000/get-game/")
            .then(response => {
                setAdmin(response.data.admin);
                setGameID(response.data.game_id);
                console.log(response.data);
            })
            .catch(error => {
                console.error("Error fetching game ID:", error);
            });
    }

    useEffect(() => {
        // Fetch the player list and game when the component mounts
        fetchPlayerList();
        fetchGame();
    }, []);

    // Function to toggle the challenge popup
    const togglePopup = () => {
        setShowPopup(!showPopup);
    };

    return (
        <div>
            <div className="lobby-container">
                {/* Render participant divs dynamically */}
                {playerList.map((player, index) => (
                    <div className="participant" key={index}>{player.username}</div>
                ))}
            </div>

            {/* Challenge popup */}
            {showPopup && (
                <div className="popup-container">
                    <div className="popup">
                        <span className="popup-close" onClick={togglePopup}>X</span>
                        <h2>Challenge</h2>
                        <p>Do you accept the challenge?</p>
                        <button>Accept</button>
                        <button onClick={togglePopup}>Decline</button>
                    </div>
                </div>
            )}
           <button className="gamemode-button" onClick={admin ? handleDelete : handleLeave}>
                {admin ? "End game" : "Leave game"}
            </button>
        </div>
    );
}

export default GameLobby;
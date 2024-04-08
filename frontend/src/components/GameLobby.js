import React, { useState } from 'react';
import axios from "axios";
import '../styles/GameLobby.css';
import Cookies from "universal-cookie";

function GameLobby() {
    const [showPopup, setShowPopup] = useState(false);
    const [gameId, setGameId] = useState(null);
    const [playerList, setPlayerList] = useState(null)

    function get_players() {
        const cookies = new Cookies();
        const token = cookies.get("csrftoken");

        console.log("getting players");
   
        
        // Make a POST request to localhost:8000/create-game with the game ID
        axios
        .get(
            "http://localhost:8000/get-game-participants/",
            {},
            {
            headers: {
                "X-CSRFToken": token, // Include CSRF token in headers
            },
            }
        )
        .then((response) => {
            console.log("participants:", response.data['participants']);
            setPlayerList(response.data['participants'])
            return response.data;
            // Handle success, if needed
        })
        .catch((error) => {
            console.error("Error getting players:", error);
            return null;
        });
    }

    function get_game() {

        const cookies = new Cookies();
        const token = cookies.get("csrftoken");

        // Make a POST request to localhost:8000/create-game with the game ID
        axios
            .get(
            "http://localhost:8000/get-game/",
            {},
            {
                headers: {
                "X-CSRFToken": token, // Include CSRF token in headers
                },
            }
            )
            .then((response) => {
                console.log("getting game");
                console.log(response.data['gameid'])
                return response.data;
                // Handle success, if needed
            })
            .catch((error) => {
                console.error("Error getting game:", error);
                return null;
        });

    }

    useState(() => {
        get_game();
        get_players();
    });

    // Function to toggle the challenge popup
    const togglePopup = () => {
        setShowPopup(!showPopup);
    };

    return (
        <div>
            <div className="lobby-container">
                {/* Participant divs */}
                <div className="participant">Player 1</div>
                <div className="participant">Player 2</div>
                <div className="participant">Player 3</div>
                {/* Add more participant divs as needed */}
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
        </div>
    );
}

export default GameLobby;

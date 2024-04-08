import React, { useState, useEffect } from 'react';
import axios from "axios";
import '../styles/GameLobby.css';

function GameLobby() {
    const [showPopup, setShowPopup] = useState(false);
    const [playerList, setPlayerList] = useState([]);

    // Function to fetch the list of participants from the server
    const fetchPlayerList = () => {
        axios.get("http://localhost:8000/get-game-participants/")
            .then(response => {
                setPlayerList(response.data.participants);
            })
            .catch(error => {
                console.error("Error fetching player list:", error);
            });
    };

    useEffect(() => {
        // Fetch the player list when the component mounts
        fetchPlayerList();
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
        </div>
    );
}

export default GameLobby;
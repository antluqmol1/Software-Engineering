import React, { useState } from 'react';
import '../styles/GameLobby.css';

function GameLobby() {
    const [showPopup, setShowPopup] = useState(false);

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

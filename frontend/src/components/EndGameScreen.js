import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/EndGameScreen.css";


const EndGameScreen = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/'); // Navigate to the home page
  };

  return (
    <div className="game-over-container">
      <div>
        <h1>GAME <br/>OVER</h1>
        <button className="button-play-again" onClick={handleNavigate}>PLAY AGAIN?</button>
      </div>
    </div>
  );
};

export default EndGameScreen;
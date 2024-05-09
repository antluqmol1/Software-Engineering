import React from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/EndGameScreen.css";


const EndGameScreen = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/'); // Navigate to the home page
  };

  return (
    <div className="container">
      <div>
        <h1>Game Over!</h1>
        <button className="button-72" onClick={handleNavigate}>Back to Home</button>
      </div>
    </div>
  );
};

export default EndGameScreen;
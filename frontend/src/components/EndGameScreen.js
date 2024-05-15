import React, {useState, useEffect} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import "../styles/EndGameScreen.css";
import userServices from "../services/userServices";
import { Leaderboard } from './Leaderboard';


const EndGameScreen = () => {
  const [gameHistory, setGameHistory] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();
  const playerList = null;

  const handleNavigate = () => {
    navigate('/'); // Navigate to the home page
  };

 
  useEffect(() => {
    
    // fetchUserData()
  },[])
  
  useEffect(() => {
    
  },[gameHistory])
  
  useEffect(() => {
    if (location.state && location.state.playerList) {
      const playerList = location.state.playerList;
      // Do something with playerList
      setGameHistory(location.state.playerList);
    } else {
      // Handle case where playerList is not passed
    }
  }, [location]);


  return (
    <div className="game-over-container">
      <h1>GAME OVER</h1>
      <div>
        {gameHistory && Array.isArray(gameHistory) && (
          <Leaderboard endgame={true} playerList={gameHistory} />
        )}
      </div>
      <button className="button-play-again" onClick={handleNavigate}>PLAY AGAIN?</button>
    </div>
  );
};

export default EndGameScreen;
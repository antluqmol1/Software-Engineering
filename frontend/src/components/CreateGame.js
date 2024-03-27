// Profile.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Profile.css';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [gameId, setGameId] = useState(null);

    function generateGameId() {
        
        // Generate a random alphanumeric string of length 6
        const gameId = Math.random().toString(36).substring(2, 8);

        setGameId(gameId)

        return gameId
      }
    
      function createGame() {
        const gameId = generateGameId();
      
        // Make a POST request to localhost:8000/create-game with the game ID
        axios.post('http://localhost:8000/create-game', { gameId })
          .then(response => {
            console.log('Game created successfully:', response.data);
            // Handle success, if needed
          })
          .catch(error => {
            console.error('Error creating game:', error);
            // Handle error, if needed
          });
      }


    useEffect(() => {

        generateGameId()

    },[])


    return (
        <div>
            <h1>Game ID: {gameId}</h1>
        </div>
    );
};

export default Profile; 
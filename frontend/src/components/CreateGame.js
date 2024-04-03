// Profile.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Profile.css';
import { Link, useNavigate } from 'react-router-dom'; // Import useHistory hook
import Cookies from 'universal-cookie'

const Profile = () => {
    const [players, setPlayers] = useState(null);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [gameId, setGameId] = useState(null);

    function display_players(player_list) {
      console.log(player_list)
      return player_list.map((player)=> <li>{player}</li>)
    }

    function generateGameId() {

        // Generate a random alphanumeric string of length 6
        const gameId = Math.random().toString(36).substring(2, 8);

        setGameId(gameId)

        return gameId
      }
    
      function createGame() {
        const gameId = generateGameId();
        const cookies = new Cookies();
	      const token = cookies.get('csrftoken')
      
        // Make a POST request to localhost:8000/create-game with the game ID
        axios.post('http://localhost:8000/create-game/', { 'gameid': gameId }, {
          headers: {
            'X-CSRFToken': token, // Include CSRF token in headers
          }
        })
          .then(response => {
            console.log('Game created successfully:', response.data);
            var player_list = get_players()
            setPlayers(player_list)
            // Handle success, if needed
          })
          .catch(error => {
            console.error('Error creating game:', error);
            // Handle error, if needed
          });
      }

    function get_players() {
      const cookies = new Cookies();
      const token = cookies.get('csrftoken')
    
      // Make a POST request to localhost:8000/create-game with the game ID
      axios.get('http://localhost:8000/get-game-participants/', {}, {
        headers: {
          'X-CSRFToken': token, // Include CSRF token in headers
        }
      })
        .then(response => {
          console.log('participants:', response.data);
          return response.data
          // Handle success, if needed
        })
        .catch(error => {
          console.error('Error creating game:', error);
          return null
        });
    }


    useEffect(() => {
        // temp fix, create game calls get_players, as they run over each other if not
        var players = createGame()
    },[])


    return (
        <div>
            <h1>Game ID: {gameId}</h1>
            {console.log("player list: ",players)}
            <h2>Players: {players}</h2>
            <display_players player_list={players} />
        </div>
    );
};

export default Profile; 
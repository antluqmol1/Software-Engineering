// Profile.js

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../styles/Profile.css";
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import Cookies from "universal-cookie";
import "../styles/GameModes.css";
import bluemargharita from "../assets/bluemargharita.jpg";
import familynight from "../assets/familynight.png";
import woods from "../assets/woods.jpg";

const LobbyAndRequest = (id, title, description) => {
  const [players, setPlayers] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [gameId, setGameId] = useState(null);

  // var players;
  // var userData;
  // var error;
  // var gameId;

  console.log("Lobby and Request");

  const generateGameId = useCallback(() => {
    // Generate a random alphanumeric string of length 6
    const gameId = Math.random().toString(36).substring(2, 8);

  console.log("setting game id");

    setGameId(gameId);

    return gameId;
  }, []);

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
        console.log("participants:", response.data);
        return response.data;
        // Handle success, if needed
      })
      .catch((error) => {
        console.error("Error creating game:", error);
        return null;
      });
  }

  function createGame(id, title, description) {
    const gameId = generateGameId();
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");
  
    console.log("inside create game")
  
    // Make a POST request to localhost:8000/create-game with the game ID
    axios
      .post(
        "http://localhost:8000/create-game/",
        { gameid: gameId, id: id, title: title, description: description},
        {
          headers: {
            "X-CSRFToken": token, // Include CSRF token in headers
          },
        }
      )
      .then((response) => {
        // Success
        console.log("Game created successfully:", response.data);
        var player_list = get_players();
        setPlayers(player_list);
      })
      .catch((error) => {
        // Error
        console.error("Error creating game:", error);
      });
  }

  // Crearte the game
  useEffect(() => {
  console.log("inside use effect");
  var players = createGame();
  }, []);

  // can i make function calls like this?
  // console.log("calling create game");
  // createGame(id, title, description)
  return players
  // (

    // <div>
    //   <h1>Game ID: {gameId}</h1>
    //   {console.log("player list: ", players)}
    //   <h2>Players: {players}</h2>
    //   <display_players player_list={players} />
    // </div>
  // );
};

function display_players(player_list) {
  console.log(player_list);
  return player_list.map((player) => <li>{player}</li>);
}

const gameModes = [
  {
    id: 1,
    title: "Night Out",
    description: "Out on the town!",
    imageUrl: bluemargharita,
    action: function() { 
      console.log("action activated")
      // var players = LobbyAndRequest(1, "Night Out", "Out on the town!"); 
    },
  },
  {
    id: 2,
    title: "Family Friendly",
    description: "Family night!",
    imageUrl: familynight,
    action: function() { 
      console.log("action activated")
      LobbyAndRequest(this.id, this.title, this.description); 
      
    },
  },
  {
    id: 3,
    title: "Mountain Hike",
    description: "Into the woods!",
    imageUrl: woods,
    action: function() {
      console.log("action activated")
      LobbyAndRequest(this.id, this.title, this.description); 
    },
  },
];

// Individual game mode card component
// Extracting this component allows for better testability and reusability.
const GameModeCard = ({ mode }) => (
  <div className="gamemode-card">
    {/* Image container for the game mode */}
    <div className="gamemode-image-wrapper">
      <img
        src={mode.imageUrl}
        alt={mode.description}
        className="gamemode-image"
      />
    </div>
    {/* Game mode description */}
    <h3>{mode.description}</h3>
    {/* Button that triggers an action when clicked, e.g., navigating to a game mode */}
    <button className="gamemode-button" onClick={mode.action}>
      {mode.title}
    </button>
  </div>
);

// Main GameModes component that renders the game mode options
const GameModes = () => {
  return (
    <div className="gamemodes-container">
      {/* Header section for the game title and subtitle */}
      <header className="gamemodes-header">
        <h1>FunChase</h1>
        <h2>Game Modes:</h2>
      </header>
      {/* Section containing all the game modes */}
      <section className="gamemodes">
        {/* Mapping through the gameModes data to create a card for each mode */}
        {gameModes.map((mode) => (
          <GameModeCard key={mode.id} mode={mode} />
        ))}
      </section>
    </div>
  );
};

export default GameModes;

// Profile.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Profile.css";
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import Cookies from "universal-cookie";
import "../styles/GameModes.css";
import bluemargharita from "../assets/bluemargharita.jpg";
import familynight from "../assets/familynight.png";
import woods from "../assets/woods.jpg";

const Profile = () => {
  const [players, setPlayers] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [gameId, setGameId] = useState(null);

  function display_players(player_list) {
    console.log(player_list);
    return player_list.map((player) => <li>{player}</li>);
  }

  function generateGameId() {
    // Generate a random alphanumeric string of length 6
    const gameId = Math.random().toString(36).substring(2, 8);

    setGameId(gameId);

    return gameId;
  }

  function createGame() {
    const gameId = generateGameId();
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");

    // Make a POST request to localhost:8000/create-game with the game ID
    axios
      .post(
        "http://localhost:8000/create-game/",
        { gameid: gameId },
        {
          headers: {
            "X-CSRFToken": token, // Include CSRF token in headers
          },
        }
      )
      .then((response) => {
        console.log("Game created successfully:", response.data);
        var player_list = get_players();
        setPlayers(player_list);
        // Handle success, if needed
      })
      .catch((error) => {
        console.error("Error creating game:", error);
        // Handle error, if needed
      });
  }

  function get_players() {
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");

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

  useEffect(() => {
    // temp fix, create game calls get_players, as they run over each other if not
    var players = createGame();
  }, []);

  return (
    <div>
      <h1>Game ID: {gameId}</h1>
      {console.log("player list: ", players)}
      <h2>Players: {players}</h2>
      <display_players player_list={players} />
    </div>
  );
};

const gameModes = [
  {
    id: 1,
    title: "Night Out",
    description: "Out on the town!",
    imageUrl: bluemargharita,
    action: () => alert("Joining Night Out!"),
  },
  {
    id: 2,
    title: "Family Friendly",
    description: "Family night!",
    imageUrl: familynight,
    action: () => alert("Joining Family Friendly!"),
  },
  {
    id: 3,
    title: "Mountain Hike",
    description: "Into the woods!",
    imageUrl: woods,
    action: () => alert("Joining Mountain Hike!"),
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

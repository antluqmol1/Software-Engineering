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

const useCreateGame = ( mode, trigger, setTrigger) => {
  const [players, setPlayers] = useState(null);
  const [userData, setUserData] = useState(null);
  const [gameError, setGameError] = useState(null);
  const [partError, setPartError] = useState(null);
  const [gameId, setGameId] = useState(null);
  const navigate = useNavigate();
  


  console.log("Lobby and Request");

  console.log(mode.id);

  const generateGameId = useCallback(() => {
    // Generate a random alphanumeric string of length 6
    const gameId = Math.random().toString(36).substring(2, 8);

    console.log("setting game id", gameId);
    setGameId(gameId)

    return gameId;
  }, []);

  function createGameBackend(id, title, description) {
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
        if (response.data['success'] != false) {
          navigate("/game-lobby")
        }
        // var player_list = get_players();
        return;
      })
      .catch((error) => {
        // Error
        setGameError(error)
        console.error("Error creating game:", error);
      });
  }

  console.log("above using effect")
  // Create the game
  useEffect(() => {
    if (trigger) {
      console.log("inside use effect - creating game");
      createGameBackend(mode.id, mode.title, mode.description);

      if (!gameError) {
        console.log("navigating")
        // navigate("/game-lobby")
      }

      console.log("players: ". playerslist)
      // Reset trigger to avoid repeated calls
      setTrigger(false); // You need to provide setTrigger function to this hook
      // navigate("/game-lobby");
    }
  }, [mode, trigger, setTrigger]); // Include setTrigger in the dependency array

  return players;
};

const gameModes = [
  {
    id: 1,
    title: "Night Out",
    description: "Out on the town!",
    imageUrl: bluemargharita,
  },
  {
    id: 2,
    title: "Family Friendly",
    description: "Family night!",
    imageUrl: familynight,
  },
  {
    id: 3,
    title: "Mountain Hike",
    description: "Into the woods!",
    imageUrl: woods,
  },
];

// Individual game mode card component
// Extracting this component allows for better testability and reusability.
const GameModeCard = ({ mode }) => {
  const [trigger, setTrigger] = useState(false);
  var playerlist = useCreateGame(mode, trigger, setTrigger);

  const handleClick = () => {
    setTrigger(true);
  }

  return (
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
    <button className="gamemode-button" onClick={handleClick}>
      {mode.title}
    </button>
  </div>
  );
};

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

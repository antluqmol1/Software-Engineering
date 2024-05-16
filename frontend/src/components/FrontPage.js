// Import the CSS file for styling
import React, { useState, useEffect, useContext } from "react";
import "../styles/Home.css";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom"; // Import useHistory hook
import { useCheckUserLoggedIn } from "../utils/authUtils"; // Import checkUserLoggedIn from authUtils
import { AuthContext } from '../AuthContext';
import PolkadotBackground from "./PolkadotBackground";
import gameServices from "../services/gameServices";
import userServices from "../services/userServices";

const FrontPage = () => {
  // const [username, setUsername] = useState(null);
  const [activeOption, setActiveOption] = useState(null); // 'join' or 'create'
  const [gameCode, setGameCode] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [invalidGameCode, setInvalidGameCode] = useState("");
  const [invalidGameTitle, setInvalidGameTitle] = useState("");
  // const [inAGame, setInAGame] = useState(false)
  const navigate = useNavigate(); // Initialize useHistory hook

  // const userIsLoggedIn = useCheckUserLoggedIn();
  const { username, setUsername, userIsLoggedIn, inAGame, setInAGame, loading } = useContext(AuthContext); //removed inAGame, setInAGame, does not work...

  useEffect(() => {
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");
    const checkLoginStatus = async () => {
      if (!userIsLoggedIn && !loading) {
        // If not logged in, redirect to the login page
        navigate("/login");
      } else if (userIsLoggedIn) {
        if (!username) {
          try {
            const response = await userServices.getUsername;
            setUsername(response.data.username);
          } catch (error) {
            console.error("There was an error!", error);
          }
        }

        // Attempt to fetch the game if not in a game
        try {
          const response = await gameServices.getGame(token);
          setInAGame(response.data.success === true);
        } catch (error) {
          console.error("There was an error!", error);
        }
      }
    };

    checkLoginStatus();
  }, [userIsLoggedIn, navigate, username, setUsername, setInAGame, loading, inAGame]);

  // Function to handle login button click
  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleSignUpClick = () => {
    navigate("/create-user");
  };

  const toggleActiveOption = (option) => {
    setActiveOption(activeOption === option ? null : option);
  };

  const handleGameCodeChange = (e) => {
    setGameCode(e.target.value); // Game codes are usually uppercase for readability
  };

  const handleGameTitleChange = (e) => {
    setGameTitle(e.target.value); // Change title of the game for each new input
  };

  const goToGame = (e) => {
    navigate("/game-lobby");
  };

  // Function to handle login button click
  const handleJoinGameSubmit = async () => {
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");

    // if (gameCode.length < 5) {
    //   // Assuming game codes are 5 characters long
    //   alert("Please enter a valid game code."); // Replace with a nicer notification or UI feedback
    //   return;
    // }

    try {
      const response = await gameServices.joinGame(gameCode, token);
      setInAGame(true);
      navigate("/game-lobby"); // Navigate to the route where GameLobby component is rendered
    } catch (error) {
      console.error("There was an error!", error);
      setInvalidGameCode("invalidGameCode");
    }
  };

  // Function to handle login button click
  const handleCreateGameSubmit = () => {
    if (gameTitle === "") {
      setInvalidGameTitle("noTitle");
      return;
    }
    navigate("/create-game", { state: gameTitle });
  };

  return (
    <div className="home-container">
      <div className='wave wave1'></div>
      <div className='wave wave2'></div>
      <div className='wave wave3'></div>
      <div className="home-content">
        <h1 className='font-style-h'>Funchase</h1>
        {userIsLoggedIn ? (
          <p>Welcome back {username ? username : "loading..."}</p>
        ) : (
          <p>Please login or create an account</p>
        )}
          {inAGame ? (
            //If user is already in an active game
            <div>
              <p>You are currently in a game, don't leave them hanging!</p>
              {/* Button to go to the game page */}
              <button className="button" onClick={goToGame}>
                Go to Game
              </button>
            </div>
          ) :
          //If a user is logged in and not in an active game
          <div className="buttons-container">
            <button
              className={`button ${activeOption === "join" ? "active" : ""}`}
              onClick={() => toggleActiveOption("join")}
            >
              Join Game
            </button>
            <button
              className={`button ${activeOption === "create" ? "active" : ""}`}
              onClick={() => toggleActiveOption("create")}
            >
              Create Game
            </button>
          </div>
          }
        {activeOption === "join" && (
          <div className="game-action-container">
            <input
              type="text"
              className="game-code-input"
              placeholder="Enter game code"
              value={gameCode}
              onChange={handleGameCodeChange}
              maxLength={6}
            />
            <button className="button" onClick={handleJoinGameSubmit}>
              Join
            </button>
            {invalidGameCode && <p>
              Invalid game code, try again
            </p>}
          </div>
        )}
        {activeOption === "create" && (
          <div className="game-action-container">
            <input
              type="text"
              className="game-code-input"
              placeholder="Enter title of the game"
              value={gameTitle}
              onChange={handleGameTitleChange}
              maxLength={16}
            />
            <button className="button" onClick={handleCreateGameSubmit}>
              Start a New Game
            </button>
            {invalidGameTitle && <p>
              Give your game a title!
            </p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FrontPage;

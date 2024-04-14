// Import the CSS file for styling
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Home.css";
import Cookies from "universal-cookie";
import { useNavigate } from "react-router-dom"; // Import useHistory hook
import { useCheckUserLoggedIn } from "../utils/authUtils"; // Import checkUserLoggedIn from authUtils

const FrontPage = () => {
  const [userData, setUserData] = useState(null);
  const [activeOption, setActiveOption] = useState(null); // 'join' or 'create'
  const [gameCode, setGameCode] = useState("");
  const [invalidGameCode, setInvalidGameCode] = useState("");
  const navigate = useNavigate(); // Initialize useHistory hook

  const userIsLoggedIn = useCheckUserLoggedIn();

  useEffect(() => {
    if (userIsLoggedIn === false) {
      // If not logged in, redirect to the login page
      console.log("Not logged in");
      navigate("/login");
    } else {
      // If logged in, fetch data or perform any necessary actions
      /* 
      When we can, lets change it from /profile to a /getusername
      */
      console.log("Already logged in");
      axios
        .get("http://localhost:8000/profile/", {
          withCredentials: true,
        })
        .then((response) => {
          setUserData(response.data.user_data);
        })
        .catch((error) => {
          console.error("There was an error!", error);
        });
    }
  }, [userIsLoggedIn, navigate]);

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
    setGameCode(e.target.value.toUpperCase()); // Game codes are usually uppercase for readability
    console.log(gameCode)
  };

  // Function to handle login button click
  const handleJoinGameSubmit = () => {
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");
    
    // if (gameCode.length < 5) {
    //   // Assuming game codes are 5 characters long
    //   alert("Please enter a valid game code."); // Replace with a nicer notification or UI feedback
    //   return;
    // }

    axios
        .post("http://localhost:8000/join-game/", 
        {  gameid: gameCode }, 
      {
        headers: {
          "X-CSRFToken": token, // Include CSRF token in headers
        },
      })
        .then((response) => {
          console.log(response.data)
          setUserData(response.data.user_data);
          navigate("/game-lobby"); // Navigate to the route where GameLobby component is rendered
        })
        .catch((error) => {
          console.error("There was an error!", error);
          setInvalidGameCode("invalidGameCode")
        });
  };
  
  // Function to handle login button click
  const handleCreateGameSubmit = () => {
    navigate("/create-game");
  };

  return (
    <div className="home-container">
    <div className = 'wave wave1'></div>
    <div className = 'wave wave2'></div>
    <div className = 'wave wave3'></div>
    <div className="home-content">
      <h1 className='font-style-h'>Funchase</h1>
        {userIsLoggedIn ? (
          <p>Welcome back {userData ? userData.username : "loading..."}</p>
        ) : (
          <p>Please login or create an account</p>
        )}
        {userIsLoggedIn ? (
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
        ) : (
          <div className="buttons-container">
            <button
              className={`button ${activeOption === "join" ? "active" : ""}`}
              onClick={() => toggleActiveOption("join")}
            >
              Join Game
            </button>
            <button className="SignUp-button" onClick={handleSignUpClick}>
              Create Game
            </button>
          </div>
          // <div className="buttons-container">
          //   {/* add some stuff here*/}
          //   <button className="login-button" onClick={handleLoginClick}>
          //     Login
          //   </button>
          //   <button className="login-button" onClick={handleSignUpClick}>
          //     Sign Up
          //   </button>
          // </div>
        )}
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
            <button className="button" onClick={handleCreateGameSubmit}>
              Start a New Game
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Here us your code ali, if you want you can see if you can get this to work?
  return (
    <div className="home-container">
    <div className = 'wave wave1'></div>
    <div className = 'wave wave2'></div>
    <div className = 'wave wave3'></div>
    <div className="home-content">
      <h1 className='font-style-h'>Funchase</h1>
      {userIsLoggedIn ? (
        <p>Welcome back {userData ? userData.username : "loading..."}</p>
      ) : (
        <p>Please login or create an account</p>
      )}
      {userIsLoggedIn ? (
        <div className="buttons-container">
          <button
            className={`button ${activeOption === "join" ? "active" : ""}`}
            onClick={() => toggleActiveOption("join")}
          >
            Join Game
          </button>
          <button
            className={`button ${activeOption === "create" ? "active" : ""}`}
            onClick={() => handleCreateGameSubmit()}
          >
            Create Game
          </button>
        </div>
      ) : (
        <div className="buttons-container">
          <button
            className={`button ${activeOption === "join" ? "active" : ""}`}
            onClick={() => toggleActiveOption("join")}
          >
            Join Game
          </button>
          <button className="SignUp-button" onClick={handleSignUpClick}>
            Create Game
          </button>
        </div>
      )}
    </div>
  </div>
);
};

export default FrontPage;

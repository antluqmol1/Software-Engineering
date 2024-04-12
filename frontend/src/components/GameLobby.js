import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useHistory hook
import axios from "axios";
import Cookies from "universal-cookie";
import "../styles/GameLobby.css";
import "../styles/App.css";
import "bootstrap/dist/css/bootstrap.min.css";

function GameLobby() {
    const [playerList, setPlayerList] = useState([]);
    const [admin, setAdmin] = useState(false);
    const [gameID, setGameID] = useState(null);
    const [taskText, setTaskText] = useState(null);
    const [taskPoints, setTaskPoints] = useState(null);
    const [GivePointButton, setGivePointButton] = useState(false); // New state
    const navigate = useNavigate();
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");

    const handleDelete = () => {
        axios
        .delete(
            "http://localhost:8000/delete-game/",
            {
            headers: {
                "X-CSRFToken": token, // Include CSRF token in headers
            },
            }
        )
        .then((response) => {
            if (response.data['success'] === true) {
                navigate("/");
            }
            else {
                console.log("failed to delete game");
            }

        return response.data;
      })
      .catch((error) => {
        console.error("Error getting players:", error);
        return null;
      });
  };

    // Request to backend for leaving game(removing player from DB).
    const handleLeave = () => {
        axios
        .put(
            "http://localhost:8000/leave-game/",
            null,
            {
                headers: {
                    "X-CSRFToken": token, // Include CSRF token in headers
                },
            }
        )
        .then((response) => {
            if (response.data['success'] === true) {
                navigate("/");
            }
            else {
                console.log("failed to leave game");
            }

        return response.data;
      })
      .catch((error) => {
        console.error("Error getting players:", error);
        return null;
      });
  };

    const fetchTask = () => {
        axios.get("http://localhost:8000/game/next-task/",
            {
                headers: {
                    "X-CSRFToken": token, // Include CSRF token in headers
                },
            }
        )
            .then(response => {
                setGivePointButton(true); // Show the givePoint button again after fetching a new task
                return response.data;
            })
            .catch(error => {
                console.error("Error fetching task:", error);
            });
    };

  // Function to fetch the list of participants from the server
  const fetchPlayerList = () => {
    axios.get("http://localhost:8000/get-game-participants/", {
        headers: {
          "X-CSRFToken": token, // Include CSRF token in headers
        },
      })
      .then((response) => {
        setPlayerList(response.data.participants);
      })
      .catch((error) => {
        console.error("Error fetching player list:", error);
      });
  };

    const fetchGame = () => {
        axios.get("http://localhost:8000/get-game/")
            .then(response => {
                setAdmin(response.data["isAdmin"]);
                setGameID(response.data["gameId"]);
                setTaskText(response.data["taskText"]);
                setTaskPoints(response.data["taskPoints"]);
            })
            .catch(error => {
                console.error("Error fetching game ID:", error);
            });
    }

    // Function assigns points to player in database, needs to be called by button on website
    const givePoints = (username, points) => {
        axios
        .put(
            "http://localhost:8000/game/give-points/",
            { 
                username: username, 
                points: points 
            },
            {
                headers: {
                    "X-CSRFToken": token, // Include CSRF token in headers
                },
            }
        )
        .then((response) => {
            if (response.data['success'] === true) {
                setGivePointButton(false); // Hide the givePoint button after clicking
            }
            else {
                console.log("failed to give points");
            }

        return response.data;
      })
      .catch((error) => {
        console.error("Error assigning points:", error);
        return null;
      });
  };

  useEffect(() => {
    // Fetch the player list and game when the component mounts
    fetchPlayerList();
    fetchGame();
  }, []);

  return (
    <div className="game-lobby">
      <div className="GameID">GameID: {gameID}</div>
      {/* Leaderboard */}
      <div className="leaderboard card position-fixed top-10 p-3">
        <h2 className="card-header text-center">Leaderboard</h2>
        <div className="card-body p-0">
          <div className="list-group list-group-flush">
            {/* Display leaderboard content here */}
            {/* Map through players array to display each player and their score */}
            {playerList.map((player, index) => (
              <div
                className="list-group-item d-flex align-items-center justify-content-start"
                key={index}
              >
                <span className="me-2">{player.username}</span>
                <span className="badge bg-secondary ms-auto me-3">
                  {player.score}
                </span>
                {GivePointButton && (
                  <button
                    className="givePoint-button btn btn-sm btn-primary"
                    onClick={() => givePoints(player.username, taskPoints)}
                  >
                    Give Points
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="questions-container">
        <div className="group-question">
          <h2 className="font-style-prompt">Challenge</h2>
          <p className="font-style">
            Points: {taskPoints} "{taskText}"
          </p>
        </div>
      </div>

      <button
        className="endGame-button"
        onClick={admin ? handleDelete : handleLeave}
      >
        {admin ? "End game" : "Leave game"}
      </button>

      <button className="fetchTask-button" onClick={fetchTask}>
        Next challenge
      </button>
      <div className="wave wave1"></div>
      <div className="wave wave2"></div>
      <div className="wave wave3"></div>
    </div>
  );
}

export default GameLobby;

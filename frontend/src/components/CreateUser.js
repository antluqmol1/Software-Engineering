import React, { useState } from "react";
import axios from "axios";
import "../styles/CreateUser.css";

// Get the the cookie information
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const CreateUser = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false); // New state for the newsletter checkbox

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleNewsletterChange = (event) => {
    setNewsletter(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const csrftoken = getCookie("csrftoken");

    console.log("Token: ", csrftoken);

    try {
      const response = await axios.put(
        "http://localhost:8000/putuser/",
        {
          username,
          email,
          password,
        },
        {
          headers: {
            "X-CSRFToken": csrftoken, // Include CSRF token in the headers
          },
        }
      );

      console.log("User created successfully", response.data);
      // Handle successful user creation, e.g., redirect to login page
    } catch (error) {
      console.error("User creation failed", error);
      // Handle user creation failure, e.g., display error message
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form-container">
        <h2>Let's get started!</h2>
        <p>
          Hatch your own Goosechase Experiences and create unforgettable
          adventures for your community. Already signed up?{" "}
          <a href="/login">Log in</a>
        </p>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">EMAIL:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              required
            />
          </div>
          <div>
            <label htmlFor="username">CREATE A USERNAME:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              required
            />
          </div>
          <div>
            <label htmlFor="password">CREATE A PASSWORD:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
            <p>Passwords must have at least 6 characters</p>
          </div>
          <div>
            <input
              type="checkbox"
              id="newsletter"
              checked={newsletter}
              onChange={handleNewsletterChange}
            />
            <label htmlFor="newsletter">
              I agree to receive Goosechase news, updates and ideas.
            </label>
          </div>
          <button type="submit" className="signup-button">
            Sign up
          </button>
        </form>
        <p>
          By signing up you accept our <a href="/terms">Terms of Service</a> and{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </div>
      <div className="information-container">
        <div className="bullet-point">
          <div className="icon"> {/* Icon Placeholder */}</div>
          <h3>Create your Experience</h3>
          <p>Get started with ready-to-go Missions or create your own</p>
        </div>
        <div className="bullet-point">
          <div className="icon"> {/* Icon Placeholder */}</div>
          <h3>Invite participants</h3>
          <p>Join from anywhere in the world, flying solo or in teams</p>
        </div>
        <div className="bullet-point">
          <div className="icon"> {/* Icon Placeholder */}</div>
          <h3>Track the action</h3>
          <p>All eyes on the activity feed and leaderboard</p>
        </div>
      </div>
      {/* Additional elements for the right side of the page, like images or icons, can be added here */}
    </div>
  );
};

export default CreateUser;

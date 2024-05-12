import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../styles/Login.css"; // Make sure your CSS matches the layout and style in the image
import { useNavigate } from 'react-router-dom'; // Import useHistory hook
import { AuthContext } from '../AuthContext';
import authServices from "../services/authServices";
import csrfServices from "../services/csrfService";


const Login = () => {
  const [localUsername, setLocalUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // State to hold error message
  const navigate = useNavigate(); // Initialize useHistory hook

  // gets the userIsLoggedIn context from the context
  const { csrfToken, setCsrfToken, setUserIsLoggedIn, setUsername } = useContext(AuthContext);

  const handleUsernameChange = (event) => {
    setLocalUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(""); // Clear previous errors
    try {

      // make a login call to the backend
      const response = await authServices.login(localUsername, password, csrfToken)
      
      // 200 is successful
      if (response.status === 200) {
        console.log("Login successful", response.data);
        console.log("JWT: ", response.data['JWT']);

        // Ask for new csrf token if logged in, old one is not suitable anymore
        const newCsrfToken = await csrfServices.getCsrfToken();
        if (newCsrfToken !== null) {
          setCsrfToken(newCsrfToken)
        } else {
          console.log("NOT GETTING NEW CSRFTOKEN")
        }

        setUserIsLoggedIn(true);
        navigate('/');
      } else {
        console.log("Login failed with status: ", response.status)
        setError("Login failed. Please check your credentials."); // Set error message
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message); // Use server-provided message
      } else if (error.response && error.response.status === 401) {
        setError("Unauthorized access. Please check your credentials and try again.");
      } else {
        // Generic error message if the error object doesn't contain specific details
        setError("An error occurred. Please try again.");
      }
      console.error("Login error:", error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <h2>Welcome back!</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              id="Username"
              placeholder="EMAIL OR USERNAME"
              value={localUsername}
              onChange={handleUsernameChange}
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              id="password"
              placeholder="PASSWORD"
              value={password}
              onChange={handlePasswordChange}
            />
          </div>
          <button type="submit" className="login-button">
            Log in
          </button>
        </form>
        <div className="signup-redirect">
          <span>Don't have a Funchase account?</span>
          <a href="/create-user">Sign up</a>
        </div>
      </div>
      <div className = 'wave wave1'></div>
        <div className = 'wave wave2'></div>
        <div className = 'wave wave3'></div>
    </div>
  );
};

export default Login;

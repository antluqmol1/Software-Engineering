import React, { useState } from "react";
import axios from "axios";
import "../styles/Login.css"; // Make sure your CSS matches the layout and style in the image

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailOrUsernameChange = (event) => {
    setEmailOrUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/login/", {
        emailOrUsername,
        password,
      });

      console.log("Login successful", response.data);
      // Handle successful login, e.g., redirect to another page
    } catch (error) {
      console.error("Login failed", error);
      // Handle login failure, e.g., display error message
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>Welcome back! Log in</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              id="emailOrUsername"
              placeholder="EMAIL OR USERNAME"
              value={emailOrUsername}
              onChange={handleEmailOrUsernameChange}
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
          <div className="forgot-password">
            <a href="/forgot-password">Forgot password?</a>
          </div>
          <button type="submit" className="login-button">
            Log in
          </button>
        </form>
        <div className="signup-redirect">
          <span>Don't have a Goosechase account? </span>
          <a href="/signup">Sign up</a>
        </div>
      </div>
      <div className="fun-fact-section">
        <p>Did you know...</p>
        <p>
          The largest ever Goosechase Experience had over 97,000 submissions!
        </p>
        {/* Include the illustration */}
      </div>
    </div>
  );
};

export default Login;

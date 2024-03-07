import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Login.css"; // Make sure your CSS matches the layout and style in the image

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    // Fetch CSRF token when component mounts
    axios.get("http://localhost:8000/grabtoken/", { withCredentials: true })
      .then(response => {
        setCsrfToken(response.data.csrfToken);
      })
      .catch(error => console.error('Error fetching CSRF token', error));
  }, []);


  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/login/", {
        username,
        password,
      }, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true
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
              id="Username"
              placeholder="EMAIL OR USERNAME"
              value={username}
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

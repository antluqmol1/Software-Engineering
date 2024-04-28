import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import "../styles/Login.css"; // Make sure your CSS matches the layout and style in the image
import { useNavigate } from 'react-router-dom'; // Import useHistory hook
import { AuthContext } from '../AuthContext';


const Login = () => {
  const [localUsername, setLocalUsername] = useState("");
  const [password, setPassword] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const navigate = useNavigate(); // Initialize useHistory hook

  // gets the userIsLoggedIn context from the context
  const { setUserIsLoggedIn, setUsername } = useContext(AuthContext);

  useEffect(() => {
    // Fetch CSRF token when component mounts
    axios.get("http://localhost:8000/grabtoken/", { withCredentials: true })
      .then(response => {
        setCsrfToken(response.data.csrfToken);
      })
      .catch(error => console.error('Error fetching CSRF token', error));
  }, []);


  const handleUsernameChange = (event) => {
    setLocalUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/login/", {
        'username': localUsername,
        'password': password,
      }, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true
      });
      
      if (response.status === 200) {
        console.log("Login successful", response.data);
        console.log("JWT: ", response.data['JWT']);
        setUserIsLoggedIn(true)
        navigate('/');
        // Handle successful login, e.g., redirect to another page
      } else {
        // Error
        console.log("Failed to login")
      }
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
          <div className="forgot-password">
            <a href="/forgot-password">Forgot password?</a>
          </div>
          <button type="submit" className="login-button">
            Log in
          </button>
        </form>
        <div className="signup-redirect">
          <span>Don't have a Boozechase account? </span>
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

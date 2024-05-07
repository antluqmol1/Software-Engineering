// App.js
import React, { useEffect } from "react";
import { AuthProvider } from './AuthContext';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import FrontPage from "./components/FrontPage";
import Login from "./components/Login";
import Logout from "./components/Logout";
import CreateUser from "./components/CreateUser";
import CreateGame from "./components/CreateGame";
import Profile from "./components/Profile";
import HomePage from "./components/HomePage";
import GameLobby from "./components/GameLobby"; // Import the GameLobby component
import AboutUs from "./components/About"; 
import "./styles/Home.css";
import "./styles/App.css";

axios.defaults.xsrfCookieName = "csrftoken";
axios.defaults.xsrfHeaderName = "X-CSRFtoken";
axios.defaults.withCredentials = true;

// Define an object with font names and URLs
var fonts = {
  'Font1': './assets/frontend/src/assets/Fonts/Pamit.ttf',
  'Font2': 'path/to/font2.woff2',
  'Font3': 'path/to/font3.woff2'
};


function App() {
  useEffect(() => {

    // Make a GET request to initialize the session and get CSRF token
    axios
      .get("http://localhost:8000/token/")
      .then((response) => {
        // Handle the response here if needed
        console.log("Session initialized");
        console.log("CSRF token from server:", response.data.csrfToken);
      })
      .catch((error) => {
        // Handle any errors here
        console.error("Error initializing session", error);
      });
  }, []); // The empty array ensures this runs once when the component mounts

  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-user" element={<CreateUser />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/create-game" element={<CreateGame />} />
            <Route path="/game-lobby" element={<GameLobby />} /> 
            <Route path="/about" element={<AboutUs/>} /> 
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

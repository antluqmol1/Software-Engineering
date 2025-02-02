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
import EndGameScreen from "./components/EndGameScreen"; // Import the EndGameScreen component
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
            <Route path="/end-game" element={<EndGameScreen />} /> {/* Add this route */}
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

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

// Function to load fonts dynamically
// function loadFonts() {
//   for (var fontName in fonts) {
//       if (fonts.hasOwnProperty(fontName)) {
//           loadFont(fontName, fonts[fontName]);
//       }
//   }
// }

// // Function to load a single font dynamically
// function loadFont(fontName, fontURL) {
//   var fontFace = new FontFace(fontName, `url(${fontURL})`);

//   fontFace.load().then(function(loadedFont) {
//       document.fonts.add(loadedFont);
//       applyFontToElements(fontName);
//   }).catch(function(error) {
//       console.error(`Font '${fontName}' loading failed:`, error);
//   });
// }

// // Function to apply font to elements
// function applyFontToElements(fontName) {
//   var elements = document.querySelectorAll('.your-class-name');
//   elements.forEach(function(element) {
//       element.style.fontFamily = fontName;
//   });
// }

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
            <Route path="/game-lobby" element={<GameLobby />} /> {/* Add route for GameLobby */}
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

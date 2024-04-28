import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [username, setUsername] = useState(null);
    const [userIsLoggedIn, setUserIsLoggedIn] = useState(null);
    const [inAGame, setInAGame] = useState(false);

    // make several calls to the backend, to see if player is in a game
    // WE SHOULD COMBINE THIS INTO ONE SINGLE CALL TO THE BACKEND, WILL 
    // MAKE THE APPLICATION A LOT SMOOTHER
    useEffect(() => {
        const checkLoginStatus = async () => {
          try {
            console.log("auth: checking if logged in")
            const response = await axios.get('http://localhost:8000/user/get-login-status/', { withCredentials: true });
            if (response.status === 200) {
              // if client is logged in
              // sets the isLoggedIn
              setUserIsLoggedIn(true);
              const usernameResponse = await axios.get('http://localhost:8000/user/get-username/', { withCredentials: true });
              // sets the username
              setUsername(usernameResponse.data.username);
              const gameResponse = await axios.get('http://localhost:8000/get-game/', { withCredentials: true });
              // sets true if in a game
              setInAGame(gameResponse.data.success);
              console.log("auth: userIsloggedIn: ", userIsLoggedIn, " data: ", response.data)
              console.log("auth: username: ", username, " data: ", usernameResponse.data)
              console.log("auth: inAGame: ", inAGame, " data: ", gameResponse.data)
            } else {
                setUserIsLoggedIn(false);
                console.log("auth: userIsLoggedIn: ", userIsLoggedIn, " data: ", response.data)
            }
          } catch (error) {
            console.error("auth: login status check failed:", error);
            setUserIsLoggedIn(false);
          }
        };
    
        checkLoginStatus();
      }, []);
    
      return (
        <AuthContext.Provider value={{ username, userIsLoggedIn, inAGame, setUserIsLoggedIn, setUsername, setInAGame }}>
          {children}
        </AuthContext.Provider>
      );
    };
      
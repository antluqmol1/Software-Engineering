import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import csrfService from './services/csrfService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [username, setUsername] = useState(null);
    const [userIsLoggedIn, setUserIsLoggedIn] = useState(null);
    const [inAGame, setInAGame] = useState(false);
    const [loading, setLoading] = useState(true);
    const [csrfToken, setCsrfToken] = useState('');

    useEffect(() => {

      // initialize auth context, sets the loading status and csrfToken
      const initializeAuth = async () => {
        setLoading(true);
        const token = await csrfService.getCsrfToken();
        setCsrfToken(token);
        checkLoginStatus();
      }

      const checkLoginStatus = async () => {

        // MAKE THIS A SINGLE BACKEND API CALL PLEASE!
        try {
          console.log("auth: checking if logged in")
          const response = await axios.get('http://localhost:8000/auth/get-status/', { withCredentials: true });
          if (response.status === 200) {
            // if client is logged in
            // sets the isLoggedIn
            setUserIsLoggedIn(true);
            const usernameResponse = await axios.get('http://localhost:8000/user/get-username/', { withCredentials: true });
            // sets the username
            setUsername(usernameResponse.data.username);
            const gameResponse = await axios.get('http://localhost:8000/game/get/', { withCredentials: true });
            // sets true if in a game
            setInAGame(gameResponse.data['success']);
            setLoading(false)
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
          setLoading(false)
        }
      };
    
      initializeAuth();
    }, []);
    
      return (
        <AuthContext.Provider value={{ loading, username, userIsLoggedIn, inAGame, csrfToken, setLoading, setUserIsLoggedIn, setUsername, setInAGame }}>
          {children}
        </AuthContext.Provider>
      );
    };
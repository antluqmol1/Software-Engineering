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

        try {
          const response = await axios.get('http://localhost:8000/auth/get-status/', { withCredentials: true });
          
          // 204 response is no content, meaning not logged in
          if (response.status === 204) {
            setUserIsLoggedIn(false);
            setLoading(false)
            return;
          }
          setUserIsLoggedIn(response.data.loggedIn);
          setUsername(response.data.username);
          setInAGame(response.data.inAGame);
          setLoading(false)
        } catch (error) {
          console.error("auth: login status check failed:", error);
          setUserIsLoggedIn(false);
          setLoading(false)
        }
      };
    
      initializeAuth();
    }, []);
    
      return (
        <AuthContext.Provider value={{ loading, username, userIsLoggedIn, inAGame, csrfToken, setLoading, setUserIsLoggedIn, setUsername, setInAGame, setCsrfToken}}>
          {children}
        </AuthContext.Provider>
      );
    };
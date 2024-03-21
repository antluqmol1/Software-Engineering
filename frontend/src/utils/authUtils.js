import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Function to check if the user is logged in by verifying the presence of a token in the session storage
export const useCheckUserLoggedIn = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  console.log("checking if user is logged in")

  useEffect(() => {
    axios.get('http://localhost:8000/profile/', {     
    withCredentials: true 
    })
      .then(response => {
        setIsLoggedIn(true);
      })
      .catch(error => {
        setIsLoggedIn(false);
      });
  }, []);
    
  return isLoggedIn;
    // Return true if a token exists, indicating that the user is logged in
    // Otherwise, return false
};
  
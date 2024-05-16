import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Function to check if the user is logged in by verifying the presence of a token in the session storage
export const useCheckUserLoggedIn = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // used to be null, changed to false, cause we check false in frontpage.js
  useEffect(() => {
    axios.get('http://localhost:8000/user/get-login-status/', {     
    withCredentials: true 
    })
      .then(response => {
        if (response.status == 200) {
          setIsLoggedIn(true); 
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(error => {
        console.log("there was an error, ", error)
        setIsLoggedIn(false);
      });
  }, []);
  return isLoggedIn;
    // Return true if a token exists, indicating that the user is logged in
    // Otherwise, return false
};
  
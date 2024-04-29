import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Function to check if the user is logged in by verifying the presence of a token in the session storage
export const useCheckUserLoggedIn = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // used to be null, changed to false, cause we check false in frontpage.js
  console.log("checking if user is logged in")

  useEffect(() => {
    axios.get('http://localhost:8000/user/get-login-status/', {     
    withCredentials: true 
    })
      .then(response => {
        console.log("status: ", response.status )
        if (response.status == 200) {
          console.log("player is logged in")
          setIsLoggedIn(true); 
        } else {
          console.log("player is NOT logged in")
          setIsLoggedIn(false);
        }
      })
      .catch(error => {
        console.log("there was an error, ", error)
        setIsLoggedIn(false);
      });
  }, []);
  console.log("is logged in before return: ", isLoggedIn)
  return isLoggedIn;
    // Return true if a token exists, indicating that the user is logged in
    // Otherwise, return false
};
  
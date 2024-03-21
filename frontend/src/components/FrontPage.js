// Import the CSS file for styling
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Home.css';
import { useNavigate } from 'react-router-dom'; // Import useHistory hook
import { useCheckUserLoggedIn } from '../utils/authUtils'; // Import checkUserLoggedIn from authUtils


const FrontPage = () => {
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate(); // Initialize useHistory hook
  
  const userIsLoggedIn = useCheckUserLoggedIn();


  useEffect(() => {
    if (userIsLoggedIn === false) {
      // If not logged in, redirect to the login page
      console.log("Not logged in")
      navigate('/login');
    } else if (userIsLoggedIn) {
      // If logged in, fetch data or perform any necessary actions
      /* 
      When we can, lets change it from /profile to a /getusername
      */
      console.log("Already logged in")
      axios.get('http://localhost:8000/profile/', {
      withCredentials: true
      })
        .then(response => {
          setUserData(response.data.user_data);
        })
        .catch(error => {
          console.error('There was an error!', error);
        });
    }
  }, [userIsLoggedIn, navigate]);

    // Function to handle login button click
    const handleLoginClick = () => {
      navigate('/login');
    };

    const handleSignUpClick = () => {
      navigate('/create-user');
    }

  return (
    <div className="home-container" style={{ backgroundImage: "url('your-background-image-url.jpg')" }}>
      <div className="home-content">
        <h1>Boozechase</h1>
        {userIsLoggedIn ? (
          <p>Welcome back {userData ? userData.username : "loading..."}</p>
        ) : (
          <p>Please login or create an account</p>
        )}
        {userIsLoggedIn ? (
          <div className="buttons-container">
            <button className="login-button" onClick={handleLoginClick}>Login</button>
            <button className="login-button" onClick={handleSignUpClick}>Sign Up</button>
          </div>
        ) : (
        <div className="buttons-container">
          {/* add some stuff here*/}
          <button className="login-button" onClick={handleLoginClick}>Login</button>
          <button className="login-button" onClick={handleSignUpClick}>Sign Up</button>
        </div>
        )}
        {/* Add more content or components as needed */}
      </div>
    </div>
  );
};

export default FrontPage;
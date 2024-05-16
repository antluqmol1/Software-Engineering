// Import React, useState, useEffect, axios, and useNavigate
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import '../styles/App.css';
import { useCheckUserLoggedIn } from '../utils/authUtils'; // Import checkUserLoggedIn from authUtils
import axios from 'axios';
import config from '../config';

const HomePage = () => {
  const [message, setMessage] = useState('');
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  // Check if the user is logged in
  const userIsLoggedIn = useCheckUserLoggedIn();

  useEffect(() => {
    const fetchData = async () => {
      if (userIsLoggedIn === false) {
        // If not logged in, redirect to the login page
        navigate('/login');
      } else if (userIsLoggedIn) {
        // If logged in, fetch data or perform any necessary actions
        try {
          const response = await axios.get(`${config.API_BASE_URL}/`);
          setMessage(response.data.message);
        } catch (error) {
          console.error('There was an error!', error);
        }
      }
    };
  
    fetchData();
  }, [userIsLoggedIn, navigate]);
  

  // Function to handle login button click
  const handleLoginClick = () => {
    navigate('/login');
  };

  // Function to handle sign up button click
  const handleSignUpClick = () => {
    navigate('/create-user');
  };

  return (
    <div className="home-container" style={{ backgroundImage: "url('your-background-image-url.jpg')" }}>
      <div className="home-content">
        <p className='font-style-h'>Boozechase</p>
        <p>{message}</p>
        {userIsLoggedIn ? (
          <div className="buttons-container">
            {/* Add logout button or any other authenticated actions */}
          </div>
        ) : (
          <div className="buttons-container">
            {/* Add login and sign up buttons */}
            <button className="login-button" onClick={handleLoginClick}>Login</button>
            <button className="login-button" onClick={handleSignUpClick}>Sign Up</button>
          </div>
        )}
        <div className = 'wave wave1'></div>
        <div className = 'wave wave2'></div>
        <div className = 'wave wave3'></div>
        {/* Add more content or components as needed */}
      </div>
    </div>
  );
};

export default HomePage;

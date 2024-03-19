// Import the CSS file for styling
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Home.css';
import { useNavigate } from 'react-router-dom'; // Import useHistory hook


const HomePage = () => {
  const [message, setMessage] = useState('');

  const navigate = useNavigate(); // Initialize useHistory hook


  useEffect(() => {
    axios.get('http://localhost:8000/') // Replace with your API URL
      .then(response => {
        setMessage(response.data.message);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  }, []);

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
        <p>{message}</p>
        {/* Add login and sign up buttons */}
        <div className="buttons-container">
          <button className="login-button" onClick={handleLoginClick}>Login</button>
          <button className="login-button" onClick={handleSignUpClick}>Sign Up</button>
        </div>
        {/* Add more content or components as needed */}
      </div>
    </div>
  );
};

export default HomePage;
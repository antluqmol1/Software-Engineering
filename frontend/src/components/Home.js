// Import the CSS file for styling
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Home.css';

const HomePage = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8000/') // Replace with your API URL
      .then(response => {
        setMessage(response.data.message);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  }, []);

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Boozechase</h1>
        <p>{message}</p>
        {/* Add more content or components as needed */}
      </div>
    </div>
  );
};

export default HomePage;

// App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import FrontPage from './components/FrontPage';
import Login from './components/Login';
import CreateUser from './components/CreateUser';
import Profile from './components/Profile';
import './styles/Home.css';
import HomePage from './components/HomePage';




function App() {


  useEffect(() => {
    // Make a GET request to initialize the session and get CSRF token
    axios.get('http://localhost:8000/token/')
      .then(response => {
        // Handle the response here if needed
        console.log('Session initialized');
        console.log('CSRF token from server:', response.data.csrfToken);
      })
      .catch(error => {
        // Handle any errors here
        console.error('Error initializing session', error);
      });

  }, []); // The empty array ensures this runs once when the component mounts



  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

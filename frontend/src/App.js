// App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import CreateUser from './components/CreateUser';
import Profile from './components/Profile';
import './styles/Home.css';



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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

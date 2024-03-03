// Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css'; // Import the CSS file

function Navbar() {
  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li><Link to="/" className="navbar-link">Home</Link></li>
        <li><Link to="/login" className="navbar-link">Login</Link></li>
        <li><Link to="/create-user" className="navbar-link">Create User</Link></li>
        <li><Link to="/profile" className="navbar-link">Profile</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;

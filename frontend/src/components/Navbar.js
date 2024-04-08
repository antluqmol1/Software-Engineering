// Navbar.js
import React from 'react';
import Cookies from 'universal-cookie'
import axios from "axios";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'; // Import useHistory hook
import '../styles/Navbar.css'; // Import the CSS file

function Navbar() {

  const navigate = useNavigate();
  const cookies = new Cookies();
  const csrfToken = cookies.get('csrftoken');

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:8000/logout/", {}, {
        headers: {
          'X-CSRFToken': csrfToken,
        }
      });
      console.log("Logout successful");
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleDeleteGame = async () => {
    try {
      await axios.delete("http://localhost:8000/delete-game/", {}, {
        headers: {
          'X-CSRFToken': csrfToken,
        }
      });
      console.log("Deleted game");
      navigate('/');
    } catch (error) {
      console.error("deletion failed", error);
    }
  };


  return (
    <nav className="navbar">
      <ul className="navbar-links">
        <li><Link to="/" className="navbar-link">Home</Link></li>
        <li><Link to="/login" className="navbar-link">Login</Link></li>
        <li><Link to="/create-user" className="navbar-link">Create User</Link></li>
        <li><Link to="/profile" className="navbar-link">Profile</Link></li>
        <span onClick={handleLogout} className="navbar-link">Logout</span>
        <span onClick={handleDeleteGame} className="navbar-link">End game</span>
      </ul>
    </nav>
  );
}

export default Navbar;

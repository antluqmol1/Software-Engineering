// Navbar.js
import React, { useContext, useEffect } from 'react';
import Cookies from 'universal-cookie'
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'; // Import useHistory hook
import { AuthContext } from '../AuthContext';
import authServices from "../services/authServices";
import '../styles/Navbar.css'; // Import the CSS file




function Navbar() {

  const navigate = useNavigate();

  const { username, setUsername, userIsLoggedIn, setUserIsLoggedIn, csrfToken } = useContext(AuthContext)

  const handleLogout = async () => {

    if (!userIsLoggedIn) { 
      //Can't logout if you're not logged in
    }

    try {
      const response = await authServices.logout(csrfToken);
      if (response.status === 200) {
        setUserIsLoggedIn(false);
        setUsername(null);
        navigate('/');
      } else {
        // Could not logout!
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="navbar">
      <ul className="navbar-links">
        {/* not the most beutiful way of doing it I guess */}
        { userIsLoggedIn &&
        <li><Link to="/" className="navbar-link">Home</Link></li>
        }
        { !userIsLoggedIn &&
          <li><Link to="/login" className="navbar-link">Login</Link></li>
        }
        { !userIsLoggedIn &&
          <li><Link to="/create-user" className="navbar-link">Create User</Link></li>
        }
        { userIsLoggedIn &&
          <li><Link to="/" onClick={handleLogout} className="navbar-link">Logout</Link></li>
        }
        {
          userIsLoggedIn &&
          <li className='right-aligned'><Link to="/profile"  className="navbar-link">{username}</Link></li>
        }
        <li><Link to="/about" className="navbar-link">About Us</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Login.css"; // Make sure your CSS matches the layout and style in the image
import { useNavigate } from 'react-router-dom'; // Import useHistory hook
import Cookies from 'universal-cookie'


// axios.defaults.xsrfCookieName = 'csrftoken';
// axios.defaults.xsrfHeaderName = 'X-CSRFtoken';
// axios.defaults.withCredentials = true;

const Logout = () => {
	// const [username, setUsername] = useState("");
	// const [password, setPassword] = useState("");
	const [csrfToken, setCsrfToken] = useState("");
	const navigate = useNavigate(); // Initialize useHistory hook

	// const cookies = new Cookies();
	// setCsrfToken(cookies.get('csrftoken'))

	  const handleSubmit = async (event) => {
		event.preventDefault();
		try {
		  const response = await axios.post("http://localhost:8000/logout/");
	
		  console.log("Logout successful", response.data);
		  navigate('/');
		  // Handle successful login, e.g., redirect to another page
		} catch (error) {
		  console.error("Logout failed", error);
		  // Handle login failure, e.g., display error message
		}
	  };

  return (
    <div>
      {/* Your JSX code here */}
      <button onClick={handleSubmit}>Logout</button>
    </div>
  );

};

export default Logout;

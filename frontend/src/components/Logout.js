import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Login.css"; // Make sure your CSS matches the layout and style in the image
import { Link, useNavigate } from 'react-router-dom'; // Import useHistory hook
import Cookies from 'universal-cookie'


const Logout = () => {

	const navigate = useNavigate(); // Initialize useHistory hook
	console.log("logging out")

	const cookies = new Cookies();
	const token = cookies.get('csrftoken')

	  const handleSubmit = async (event) => {
		event.preventDefault();
		console.log("sending logout request")
		console.log(token)
		try {
		  const response = await axios.post("http://localhost:8000/logout/",{},  
		  	{
				headers: {
                    'X-CSRFToken': token, // Include CSRF token in headers
                }
			}
		);
		
		console.log("Logout successful", response.data);
		navigate('/');
		window.location.reload();
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
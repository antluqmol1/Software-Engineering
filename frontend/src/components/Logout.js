import React, { useState, useEffect } from "react";
import "../styles/Login.css"; // Make sure your CSS matches the layout and style in the image
import { Link, useNavigate } from 'react-router-dom'; // Import useHistory hook
import Cookies from 'universal-cookie'
import authServices from "../services/authServices";


const Logout = () => {

	const navigate = useNavigate(); // Initialize useHistory hook

	const cookies = new Cookies();
	const token = cookies.get('csrftoken')

	  const handleSubmit = async (event) => {
		event.preventDefault();
		try {
		  const response = await authServices.logout(token)
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
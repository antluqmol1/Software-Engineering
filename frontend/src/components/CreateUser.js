import React, { useState } from 'react';
import axios from 'axios';
import "../styles/CreateUser.css"; // Make sure your CSS matches the layout and style in the image


// Get the the cookie information
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const CreateUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [first_name, setFirstname] = useState('');
  const [last_name, setLastname] = useState('');
  const [email, setEmail] = useState('');

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleFirstNameChange = (event) => {
    setFirstname(event.target.value);
  };

  const handleLastNameChange = (event) => {
    setLastname(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const csrftoken = getCookie('csrftoken');

    console.log("Token: ",csrftoken)

    try {
      const response = await axios.put('http://localhost:8000/putuser/', {
        first_name,
        last_name,
        username,
        email,
        password,
      }, {
        headers: {
          'X-CSRFToken': csrftoken,  // Include CSRF token in the headers
        }
      });

      console.log('User created successfully', response.data);
      // Handle successful user creation, e.g., redirect to login page
    } catch (error) {
      console.error('User creation failed', error);
      // Handle user creation failure, e.g., display error message
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form-container" onSubmit={handleSubmit}>
        <h2>Create User</h2>
        <div>
          <label htmlFor="firstname">First Name:</label>
          <input
            className='input-box'
            type="text"
            id="firstname"
            value={first_name}
            onChange={handleFirstNameChange}
          />
        </div>
        <div>
          <label htmlFor="lastname">Last Name:</label>
          <input
            className='input-box'
            type="text"
            id="lastname"
            value={last_name}
            onChange={handleLastNameChange}
          />
        </div>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            className='input-box'
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
          />
        </div>
        <div>
          <label htmlFor="email">E-mail:</label>
          <input
            className='input-box'
            type="text"
            id="email"
            value={email}
            onChange={handleEmailChange}
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            className='input-box'
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <button type="submit" className="signup-button">Create User</button>
      <div className="signup-redirect">
        <span className='login2'>Already have an account? </span>
          <a className='login2' href="/login">Log in</a>
      </div>
      </form>

      {/* Information container */}
      {/*<div className="information-container">
      </div>*/}
        <div className = 'wave wave1'></div>
        <div className = 'wave wave2'></div>
        <div className = 'wave wave3'></div>
    </div>
  );
};


export default CreateUser;
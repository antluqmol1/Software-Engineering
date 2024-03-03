import React, { useState } from 'react';
import axios from 'axios';

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
    try {
      const response = await axios.put('http://localhost:8000/putuser/', {
        first_name,
        last_name,
        username,
        email,
        password,
      });

      console.log('User created successfully', response.data);
      // Handle successful user creation, e.g., redirect to login page
    } catch (error) {
      console.error('User creation failed', error);
      // Handle user creation failure, e.g., display error message
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="firstname">First Name:</label>
        <input
          type="text"
          id="firstname"
          value={first_name}
          onChange={handleFirstNameChange}
        />
      </div>
      <div>
        <label htmlFor="lastname">Last Name:</label>
        <input
          type="text"
          id="lastname"
          value={last_name}
          onChange={handleLastNameChange}
        />
      </div>
      <div>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={handleUsernameChange}
        />
      </div>
      <div>
        <label htmlFor="email">E-mail:</label>
        <input
          type="text"
          id="email"
          value={email}
          onChange={handleEmailChange}
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={handlePasswordChange}
        />
      </div>
      <button type="submit">Create User</button>
    </form>
  );
};

export default CreateUser;

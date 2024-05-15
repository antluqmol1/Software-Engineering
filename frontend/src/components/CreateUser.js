import React, { useState , useContext} from 'react';
import "../styles/CreateUser.css"; // Make sure your CSS matches the layout and style in the image
import { useNavigate } from "react-router-dom"; // Import useHistory hook
import { AuthContext } from '../AuthContext';
import authServices from "../services/authServices";
import userServices from "../services/userServices";


// Custom hook for handling form submission errors
const useFormErrorHandling = () => {
  const [errorMessage, setErrorMessage] = useState('');

  const handleFormError = (error) => {
    if (error.response) {
    if (error.response.status === 409) {
      setErrorMessage(error.response.data.error);
    } else {
      setErrorMessage('An error occurred. Please try again.');
    }
  } else if (error.request) {
    setErrorMessage('Network error. Please check your connection and try again.');
  } else {
    setErrorMessage('An unexpected error occurred. Please try again later.');
  }
  };

  return { errorMessage, handleFormError };
};


const CreateUser = () => {
  const {errorMessage, handleFormError } = useFormErrorHandling();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [first_name, setFirstname] = useState('');
  const [last_name, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // USERNAME WILL NOT BE SET IN THIS FILE AT THIS TIME, WE NEED TO CHANGE THE ABOVE useState USERNAME SHIT
  const { csrfToken, setUserIsLoggedIn, } = useContext(AuthContext);

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
      const response = await userServices.createUser(first_name, last_name, username, email, password, csrfToken);

      if (response.data.success == true) {

        try{
          const loginResponse = await authServices.login(username, password, csrfToken);
          if (loginResponse.data.success == true) {
            setUserIsLoggedIn(true);
            navigate("/profile")
          }
        }
        catch (error){
          console.error("login failed", error)
        }
      }

      // Handle successful user creation, e.g., redirect to login page
    } catch (error) {
      console.error('User creation failed', error);
      handleFormError(error);
    
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form-container" onSubmit={handleSubmit}>
        <h2>Create User</h2>
        {/* {errorMessage && <p className="error-message">{errorMessage}</p>} */}
        {errorMessage && <div className="d-flex justify-content-center">
          <div className="alert alert-danger" role="alert">{errorMessage}</div>
        </div>}
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
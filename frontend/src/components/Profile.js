// Profile.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Profile.css";

const Profile = () => {
  const [userData, setUserData] = useState({
    // Initialize state with empty default values
    username: "",
    email: "",
  });

  useEffect(() => {
    // We might want to authenticate this request
    axios
      .get("http://localhost:8000/profile/")
      .then((response) => {
        setUserData(response.data.user_data);
      })
      .catch((error) => {
        console.error("There was an error fetching the user data!", error);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit form data
    console.log("Form submitted", userData);
  };

  return (
    <div className="profile-container">
      <div className="account-info-card">
        <div className="profile-photo-section">
          {/* Assume you have a method to handle file uploads */}
          <img src="/path/to/default/avatar.jpg" alt="Profile" />
          <button className="upload-image-button">Upload Image</button>
          <p>We recommend JPG or PNG</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">USERNAME</label>
            <input
              type="text"
              id="username"
              name="username"
              value={userData.username}
              onChange={handleInputChange}
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">EMAIL</label>
            <input
              type="email"
              id="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="save-changes-button">
              Save changes
            </button>
            <button type="button" className="delete-account-button">
              Delete Account
            </button>
          </div>
        </form>
      </div>
      <div className="subscription-card">
        <h3>Subscription</h3>
        <button className="upgrade-button">Upgrade to a subscription</button>
        <p>
          Unlimited live simultaneous Experiences and up to 250 creator accounts
        </p>
        <button className="view-plans-button">View plans</button>
        <p>No active subscription</p>
        <a href="/billing-details">Billing details</a>
      </div>
    </div>
  );
};

export default Profile;

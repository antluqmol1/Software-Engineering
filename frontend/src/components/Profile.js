// Profile.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card } from "react-bootstrap";
import "../styles/Profile.css";
import defaultProfilePic from "../assets/woods.jpg";
import { Button } from "react-bootstrap";

const Profile = () => {
  // State for storing user data
  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
  });

  //State for editing first_name, last_name or username
  const [editing, setEditing] = useState({
    first_name: false,
    last_name: false,
    username: false,
  });

  // State for storing the selected profile image file or the default image
  const [profilePic, setProfilePic] = useState(defaultProfilePic);
  // State for storing any potential errors
  const [error, setError] = useState(null);

  // useEffect(() => {
  //     // Fetch CSRF token when component mounts
  //     axios.get("http://localhost:8000/grabtoken/", { withCredentials: true })
  //       .then(response => {
  //         setCsrfToken(response.data.csrfToken);
  //       })
  //       .catch(error => console.error('Error fetching CSRF token', error));
  //   }, []);

  console.log("getting profile");

  // Fetch user data when component mounts
  useEffect(() => {
    // Fetch user data when the component mounts
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/profile/", {
          withCredentials: true,
        });
        setUserData(response.data.user_data);
      } catch (error) {
        console.error("There was an error!", error);
        setError(error);
      }
    };
    fetchUserData();
  }, []);

  const handleEdit = (field) => {
    setEditing({ ...editing, [field]: true });
  };

  const handleCancel = (field) => {
    setEditing({ ...editing, [field]: false });
    // Reset the userData for the field to its original value if needed
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleFieldSave = async (field) => {
    const updatedValue = userData[field];

    try {
      // Replace 'http://localhost:8000/profile/update' with your actual backend endpoint
      // The body of the request may need to be adjusted based on your backend API's expected format
      const response = await axios.put(
        `http://localhost:8000/profile/update-profile/`,
        {
          field: field,
          value: updatedValue,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            // Any other headers that your backend requires
          },
        }
      );

      // If the backend response is successful, update the userData state
      if (response.status === 200) {
        setUserData((prevUserData) => ({
          ...prevUserData,
          [field]: updatedValue,
        }));
      } else {
        // Handle any unsuccessful responses here
        console.error("Failed to update the field:", field, response.data);
      }
    } catch (error) {
      // Handle errors such as network issues, server down, etc.
      console.error("There was an error updating the user data!", error);
    }

    // Regardless of the outcome, stop editing the field
    setEditing((prevEditing) => ({ ...prevEditing, [field]: false }));
  };

  // Handles file selection and updates the setProfilePic state
  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePic(URL.createObjectURL(file)); // Update the image preview
    }
  };

  // Handles the file upload action
  const handleUpload = async () => {
    if (setProfilePic) {
      const formData = new FormData();
      // Append selected file to form data
      formData.append("profileImage", setProfilePic); // 'profileImage' is the key expected by the backend

      try {
        // Send POST request to the server to upload the profile image
        const response = await axios.post(
          "http://localhost:8000/upload-profile-photo/",
          formData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // Log the server response after successful upload
        console.log(response.data);

        // Additional logic to update the profile picture can be added here
      } catch (error) {
        // Log any error during the upload process
        console.error("There was an error uploading the file!", error);
      }
    }
  };

  // Render error message if an error occurred
  if (error) {
    return <div>An error occurred: {error.message}</div>;
  }

  // Main render return for the component
  return (
    <div className="profile-container">
      <h1 className="profile-heading">Profile Page</h1>
      <div className="profile-wrapper">
        <div className="profile-photo-upload-section">
          <input
            id="profile-image-upload"
            type="file"
            onChange={handleImageChange}
            accept=".jpg, .jpeg, .png"
            hidden
          />
          {setProfilePic && (
            <div>
              <img
                src={profilePic}
                alt="Profile"
                className="profile-photo-preview"
              />
            </div>
          )}
          <label htmlFor="profile-image-upload" className="custom-file-upload">
            Upload Image
          </label>
          <button onClick={handleUpload} className="upload-button">
            Save
          </button>
          <div>We recommend JPG or PNG</div>
        </div>

        {userData && (
          <Card className="profile-card">
            <Card.Body>
              {/* First Name */}
              <Card.Text className="profile-item">
                <label>First Name:</label>
                {editing.first_name ? (
                  <input
                    type="text"
                    name="first_name"
                    value={userData.first_name}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span>{userData.first_name}</span>
                )}
                {!editing.first_name ? (
                  <Button onClick={() => handleEdit("first_name")}>Edit</Button>
                ) : (
                  <>
                    <Button onClick={() => handleFieldSave("first_name")}>
                      Save
                    </Button>
                    <Button onClick={() => handleCancel("first_name")}>
                      Cancel
                    </Button>
                  </>
                )}
              </Card.Text>
              {/* Last Name */}
              <Card.Text className="profile-item">
                <label>Last Name:</label>
                {editing.last_name ? (
                  <input
                    type="text"
                    name="last_name"
                    value={userData.last_name}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span>{userData.last_name}</span>
                )}
                {!editing.last_name ? (
                  <Button onClick={() => handleEdit("last_name")}>Edit</Button>
                ) : (
                  <>
                    <Button onClick={() => handleFieldSave("last_name")}>
                      Save
                    </Button>
                    <Button onClick={() => handleCancel("last_name")}>
                      Cancel
                    </Button>
                  </>
                )}
              </Card.Text>
              {/* Username */}
              <Card.Text className="profile-item">
                <label>Username:</label>
                {editing.username ? (
                  <input
                    type="text"
                    name="username"
                    value={userData.username}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span>{userData.username}</span>
                )}
                {!editing.username ? (
                  <Button onClick={() => handleEdit("username")}>Edit</Button>
                ) : (
                  <>
                    <Button onClick={() => handleFieldSave("username")}>
                      Save
                    </Button>
                    <Button onClick={() => handleCancel("username")}>
                      Cancel
                    </Button>
                  </>
                )}
              </Card.Text>
              {/* Email */}
              <Card.Text className="profile-item">
                <label>Email:</label> {userData.email}
              </Card.Text>
            </Card.Body>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;

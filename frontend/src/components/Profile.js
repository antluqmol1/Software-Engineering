// Profile.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { Card } from "react-bootstrap";
import "../styles/Profile.css";
import defaultProfilePic from "../assets/woods.jpg";
import { Button } from "react-bootstrap";

const Profile = () => {
  // State to control the current view in the right container
  const [currentView, setCurrentView] = useState("editProfile");

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
  const [profilePic, setProfilePic] = useState(null);
  // state for storing the selected file for upload
  const [profilePicFile, setProfilePicFile] = useState(null);

  const [gallery, setGallery] = useState(null);
  const [showGallery, setShowGallery] = useState(false);

  // state for changing the password
  const [showChangePassword, setShowChangePassword] = useState(false);

  // State for storing any potential errors
  const [error, setError] = useState(null);

  // get the csrf token from the cookies
  const cookies = new Cookies();
  const token = cookies.get("csrftoken");

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

        // you are not logged in!
        setError(error);
      }
    };

    const fetchProfilePicture = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/profile/get-profile-picture/",
          {
            withCredentials: true,
          }
        );
        const base64Image = response.data.image;
        console.log("Received image data:", base64Image);
        setProfilePic(`data:image/png;base64,${base64Image}`);
      } catch (error) {
        console.error("There was an error!", error);
      }
    };

    fetchUserData();
    fetchProfilePicture();
  }, []);

  // Handlers for switching views
  const showEditProfile = () => setCurrentView("editProfile");
  const showGalleryView = () => setCurrentView("gallery");

  // Handle field editing
  const handleEdit = (field) => {
    setEditing({ ...editing, [field]: true });
  };
  const handleCancel = (field) => {
    setEditing({ ...editing, [field]: false });
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleFieldSave = async (field) => {
    const updatedValue = userData[field];
    const cookies = new Cookies();
    const token = cookies.get("csrftoken");
    console.log(field);
    console.log(updatedValue);

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
          headers: {
            "X-CSRFToken": token, // Include CSRF token in headers
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
      setProfilePicFile(file);
    }
  };

  const handleSelectProfilePic = async (imagePath) => {
    console.log("Selected image to set as profile:", imagePath);
    try {
      const response = await axios.post(
        "http://localhost:8000/profile/update-profile-picture/",
        { newProfilePicUrl: imagePath },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json", "X-CSRFToken": token },
        }
      );
      if (response.data.success) {
        console.log("Profile picture updated successfully!");
        // Optionally, refresh the displayed profile picture in the UI
        setProfilePic(imagePath);
      } else {
        console.error("Failed to update profile picture:", response.data.error);
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
    }
  };

  // Deletes profile pictures from the backend
  const handleDeleteImage = async (imagePath) => {
    console.log("Deleting image:", imagePath);
    try {
      // Assume imagePath contains the necessary identifier for deletion
      const response = await axios.delete(
        `http://localhost:8000/profile/delete-profile-picture/`,
        {
          data: { imagePath },
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        console.log("Image deleted successfully");
        // Remove the image from the gallery state
        setGallery((prev) => prev.filter((img) => img !== imagePath));
      } else {
        console.error("Failed to delete the image:", response.data.error);
      }
    } catch (error) {
      console.error("Error deleting the image:", error);
    }
  };

  // Handles the file upload action
  const handleUpload = async () => {
    if (setProfilePic) {
      console.log("Uploading picture!");
      const formData = new FormData();
      console.log("filedata to upload: ", profilePicFile);
      // Append selected file to form data
      formData.append("profileImage", profilePicFile); // 'profileImage' is the key expected by the backend

      try {
        // Send POST request to the server to upload the profile image
        const response = await axios.post(
          "http://localhost:8000/profile/upload-profile-picture/",
          formData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
              "X-CSRFToken": token,
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

  // toggles the gallery dropdown and makes a request to the backend for image urls in clients profiles
  const handleShowGallery = async () => {
    if (showGallery) {
      setShowGallery(false);
      return;
    } else {
      setShowGallery(true);
      setShowChangePassword(false);
    }

    try {
      const response = await axios.get(
        "http://localhost:8000/profile/get-all-profile-pictures/",
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
          },
        }
      );
      if (response.data.success) {
        console.log("fetch gallery OK");
        console.log(response.data.files);
        setGallery(response.data.files);
        setShowGallery(true);
      } else {
        console.error("Failed to fetch images", response.data.error);
      }
    } catch (error) {
      console.error("Error fetching images", error);
    }
  };

  // Function to toggle the visibility of the change password form
  const handleToggleChangePassword = async () => {
    if (showChangePassword) {
      // If the change password form is currently shown, hide it
      setShowChangePassword(false);
      return;
    } else {
      // Otherwise, show the change password form and hide the gallery
      setShowChangePassword(true);
      setShowGallery(false);
    }

    // try {
    //   // Example of an API call that you might want to perform
    //   const response = await axios.get(
    //     "http://localhost:8000/profile/validate-session/",
    //     {
    //       withCredentials: true,
    //       headers: {
    //         "Content-Type": "application/json",
    //         "X-CSRFToken": token,
    //       },
    //     }
    //   );

    //   // Handle the API response based on your backend logic
    //   if (response.data.success) {
    //     console.log("Session validation successful:", response.data);
    //   } else {
    //     console.error("Session validation failed:", response.data.error);
    //   }
    // } catch (error) {
    //   console.error("Error during session validation:", error);
    // }
  };

  // Render error message if an error occurred
  if (error) {
    return <div>An error occurred: {error.message}</div>;
  }

  const renderRightContainer = () => {
    if (showGallery) {
      return (
        <div className="gallery-container">
          {gallery && showGallery && gallery.length > 0 && (
            <>
              <h3>Your Gallery</h3>
              <div className="gallery">
                {gallery.map((image, index) => (
                  <div key={index} className="image-container">
                    <img
                      src={image}
                      alt={`Uploaded ${index}`}
                      className="gallery-img"
                      onClick={() => handleSelectProfilePic(image)}
                    />
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteImage(image)}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    } else if (showChangePassword) {
      return (
        <div className="change-password-form">
          <h3>Change Password</h3>
          <form>
            <div>
              <label>Current Password:</label>
              <input type="password" name="currentPassword" required />
            </div>
            <div>
              <label>New Password:</label>
              <input type="password" name="newPassword" required />
            </div>
            <div>
              <label>Confirm New Password:</label>
              <input type="password" name="confirmPassword" required />
            </div>
            <button type="submit" className="submit-button">
              Change Password
            </button>
          </form>
        </div>
      );
    } else {
      return (
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
      );
    }
  };

  // Main render return for the component
  return (
    <div className="profile-container">
      <h1 className="profile-heading">Profile Page</h1>
      <div className="profile-wrapper">
        {/* Left-side navigation */}
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

          <button onClick={handleShowGallery}>
            {showGallery ? "hide profile pictures" : "show profile pictures"}
          </button>

          <button onClick={handleToggleChangePassword}>
            {showChangePassword ? "hide Change Password Section" : "Change password"}
          </button>
        </div>
      </div>
      {/* Right-side container */}

      {renderRightContainer()}

      <div className="wave wave1"></div>
      <div className="wave wave2"></div>
      <div className="wave wave3"></div>
    </div>
  );
};

export default Profile;

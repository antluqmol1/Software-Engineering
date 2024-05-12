// Profile.js

import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import Cookies from "universal-cookie";
import { Card } from "react-bootstrap";
import "../styles/Profile.css";
import defaultProfilePic from "../assets/woods.jpg";
import { Button } from "react-bootstrap";
import { Navigate, useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackspace } from "@fortawesome/free-solid-svg-icons";
import userServices from "../services/userServices";
import { AuthContext } from '../AuthContext';



const Profile = () => {
  // State to control the current view in the right container
  const [currentView, setCurrentView] = useState("editProfile");

  const { userIsLoggedIn, loading} = useContext(AuthContext);

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

  // navigate
  const navigate = useNavigate(); // Initialize useHistory hook

  // State for storing any potential errors
  const [error, setError] = useState(null);

  // get the csrf token from the cookies
  const cookies = new Cookies();
  const token = cookies.get("csrftoken");

  console.log("getting profile");

  // NOT WORKING, FIX
  useEffect (() => {

    if (!loading && !userIsLoggedIn) {
      navigate("/")
    }else {
      console.log("In a game")
    }

  }, [loading, userIsLoggedIn]); 

  // Fetch user data when component mounts
  useEffect(() => {

    // Fetch user data when the component mounts
    const fetchUserData = async () => {
      try {

        // Fetch profile data
        const response = await userServices.getProfile();

        // handle response
        if (response.status == 200) {
          setUserData(response.data.user_data);
        } else {
          console.error("failed to fetch user data, response: ", response)
        }

      } catch (error) {
        console.error("There was an error!", error);

        // Check if the error is due to unauthorized access
        if (error.response.status === 401) {
          // setError("Please log in to view your profile.");
        } else {
          // setError("An unexpected error occurred. Please try again later.");
        }
      }
    };

    const fetchProfilePicture = async () => {
      try {

        // Fetch pictures
        const response = await userServices.getPictureBase64();

        // handle response
        if (response.status == 200) {
          const base64Image = response.data.image;
          console.log("Received image data:", base64Image);
          setProfilePic(`data:image/png;base64,${base64Image}`);
        } else {
          console.error("failed to fetch pictures, response: ", response)
        }

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
      const response = await axios.put(
        `http://localhost:8000/user/profile/update/`,
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
        const response = await axios.put(
            "http://localhost:8000/user/profile/update-picture/",
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
        const response = await axios.delete(`http://localhost:8000/user/profile/delete-picture/`, {
            data: { imagePath },
            headers: { 
              "Content-Type": 
              "application/json", 
              "X-CSRFToken": token },
            withCredentials: true
        });

        if (response.data.success) {
            console.log("Image deleted successfully");
            // Remove the image from the gallery state
            setGallery(prev => prev.filter(img => img !== imagePath));
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
          "http://localhost:8000/user/profile/upload-picture/",
          formData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
              "X-CSRFToken": token,
            },
          }
        );

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

        if (response.data.success && response.data.image_url) {
          const uploadedImageUrl = response.data.image_url;
          console.log("Uploaded image URL:", uploadedImageUrl);
  
          // Update the gallery state to include the newly uploaded image
          setGallery((prevGallery) => [...prevGallery, uploadedImageUrl]);
  
          // Optionally, update the profile picture preview as well
          setProfilePic(uploadedImageUrl);
        } else {
          console.error("Failed to upload the image:", response.data.error);
        }

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
        "http://localhost:8000/user/profile/get-all-pictures/",
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
    return (
      <div className="error-container">
        {error && (
          <div className="error-message">
            {error}
            
            <div className="arrow-container">
              {error.includes("log in") && (
                <div>
                  Click here:{" "}
                  <span onClick={Navigate('/login')}><FontAwesomeIcon icon={faBackspace} className="arrow-icon" /></span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRightContainer = () => {
    if (showGallery) {
      return (
        <div className="gallery-container">
          {gallery && showGallery && gallery.length > 0 && (
            <>
              <h3>Your Gallery:</h3>
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
          <div className="button-and-text-container">
            {/* Groupped-Buttons */}
            <div className="button-group">
              <label htmlFor="profile-image-upload" className="custom-file-upload">
                Upload Image
              </label>
              <button onClick={handleUpload} className="upload-button">
                Save
              </button>
            </div>
            {/* Recommendation Text */}
            <span className="recommendation-text">We recommend JPG or PNG</span>
          </div>
        </div>
      );
    } else if (showChangePassword) {
      return (
        <div className="change-password-form">
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
          {/* Hidden file input for image upload */}
          <input
            id="profile-image-upload"
            type="file"
            onChange={handleImageChange}ƒerr
            accept=".jpg, .jpeg, .png"
            hidden
          />
          {/* Profile Picture Preview */}
          {setProfilePic && (
            <div>
              <img
                src={profilePic}
                alt="Profile"
                className="profile-photo-preview"
              />
            </div>
          )}
          {/* Show/Hide Gallery Button */}
          <div>
            <button onClick={handleShowGallery}>
              {showGallery ? "hide profile pictures" : "show profile pictures"}
            </button>
          </div>
          {/* Change Password Button */}
          <div>
            <button onClick={handleToggleChangePassword}>
              {showChangePassword ? "hide Change Password Section" : "Change password"}
            </button>
          </div>
        </div>
        {/* Right-side container */}
        {renderRightContainer()}
      </div>

      <div className="wave wave1"></div>
      <div className="wave wave2"></div>
      <div className="wave wave3"></div>
    </div>
  );
};

export default Profile;

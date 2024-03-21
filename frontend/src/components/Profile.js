// Profile.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from 'react-bootstrap';
import '../styles/Profile.css';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);

    // useEffect(() => {
    //     // Fetch CSRF token when component mounts
    //     axios.get("http://localhost:8000/grabtoken/", { withCredentials: true })
    //       .then(response => {
    //         setCsrfToken(response.data.csrfToken);
    //       })
    //       .catch(error => console.error('Error fetching CSRF token', error));
    //   }, []);

    console.log("getting profile")

    useEffect(() => {
        axios.get('http://localhost:8000/profile/', {     
        withCredentials: true 
        })
            .then(response => {
                setUserData(response.data.user_data);
            })
            .catch(error => {
                console.error('There was an error!', error);
            });
    }, []);

    return (
        <div className="profile-container">
            <h1 className="profile-heading">Profile Page</h1>
            {userData && (
                <Card className="profile-card">
                    <Card.Body>
                        <Card.Text className="profile-item">
                            <label>First Name:</label> {userData.first_name}
                        </Card.Text>
                        <Card.Text className="profile-item">
                            <label>Last Name:</label> {userData.last_name}
                        </Card.Text>
                        <Card.Text className="profile-item">
                            <label>Username:</label> {userData.username}
                        </Card.Text>
                        <Card.Text className="profile-item">
                            <label>Email:</label> {userData.email}
                        </Card.Text>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default Profile; 
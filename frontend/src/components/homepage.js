import React, { useState, useEffect } from 'react';
import axios from 'axios';

// this is not done, most likely we don't need to make a API call for
// the root to get back. all handled by the react app

const HomePage = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get('http://localhost:8000/') // Replace with your API URL
            .then(response => {
                setMessage(response.data.message);
            })
            .catch(error => {
                console.error('There was an error!', error);
            });
    }, []);

    return (
        <div>
            <h1>{message}</h1>
        </div>
    );  
};

export default HomePage;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HelloWorld = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get('http://localhost:8000/helloworld') // Replace with your API URL
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

export default HelloWorld;

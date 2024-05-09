import axios from 'axios';

// get a csrf token from the backend
const getCsrfToken = async () => {
  try {
    const response = await axios.get('http://localhost:8000/auth/grabtoken/', { withCredentials: true });
    return response.data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

export default {
  getCsrfToken,
};
import axios from 'axios';
import config from '../config';


// get a csrf token from the backend
const getCsrfToken = async () => {
    console.log("csrfService: Getting token")
  try {
    const response = await axios.get(`${config.API_BASE_URL}/auth/grabtoken/`, { withCredentials: true });
    return response.data.csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

export default {
  getCsrfToken,
};
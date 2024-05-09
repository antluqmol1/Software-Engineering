import axios from 'axios';
import config from '../config';


// Login service
const login = async (username, password, csrfToken) => {
  return axios.post(`${config.API_BASE_URL}/auth/login/`, {
    username,
    password,
  }, {
    headers: {
      'X-CSRFToken': csrfToken,
    },
    withCredentials: true
  });
};

// Logout service
const logout = async (csrfToken) => {
  return axios.post(`${config.API_BASE_URL}/auth/logout/`, {}, {
        headers: {
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true
  });
}

export default {
  login, logout
};
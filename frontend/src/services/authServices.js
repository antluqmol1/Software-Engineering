import axios from 'axios';
import config from '../config';


// Login service
const login = async (username, password, csrfToken) => {
  return axios.post(`${config.API_BASE_URL}/login/`, {
    username,
    password,
  }, {
    headers: {
      'X-CSRFToken': csrfToken,
    },
    withCredentials: true
  });
};

export default {
  login,
};
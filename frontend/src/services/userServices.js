import axios from 'axios';
import config from '../config';


const createUser = async (first_name, last_name, username, email, password, csrfToken) => {
    return axios.put(`${config.API_BASE_URL}/user/put/`, {
            first_name,
            last_name,
            username,
            email,
            password,
          }, {
            headers: {
              'X-CSRFToken': csrftoken,  // Include CSRF token in the headers
            }
    });
}


export default {
    createUser, 
  };
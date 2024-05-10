import axios, { AxiosHeaders } from 'axios';
import config from '../config';


const getProfilePictures = async (csrfToken) => {
    return axios.get(`${config.API_BASE_URL}/game/get-participants-images/`, { }, {
        Headers: {
            'X-CSRFToken': csrfToken,  // Include CSRF token in the headers
        },
        withCredentials: true
    });
}


export default {
    getProfilePictures,
};
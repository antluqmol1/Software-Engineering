import axios, { AxiosHeaders } from 'axios';
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
              'X-CSRFToken': csrfToken,  // Include CSRF token in the headers
            }
    });
}

const getProfile = async () => {
    return axios.get(`${config.API_BASE_URL}/user/profile/get`, {
        withCredentials: true,
    })
}

const updateProfile = async (field, updatedValue, csrfToken) => {
    const response = await axios.put(
        `${config.API_BASE_URL}/profile/update-profile/`,
        {
          field: field,
          value: updatedValue,
        },
        {
            headers: {
              "X-CSRFToken": csrfToken,
            },
        }
      );
}

const getPictureBase64 = async () => {
    return axios.get(`${config.API_BASE_URL}/user/profile/get-picture/`, {
        withCredentials: true,
    });
}

const uploadPicture = async () => {

}

const getAllPictures = async () => {

}


export default {
    createUser, getProfile, updateProfile, getPictureBase64, uploadPicture, getAllPictures,
  };
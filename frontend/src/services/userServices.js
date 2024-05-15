import axios, { AxiosHeaders } from 'axios';
import config from '../config';


const createUser = async (
  first_name,
  last_name,
  username,
  email,
  password,
  csrfToken
) => {
  return axios.post(`${config.API_BASE_URL}/user/create/`,
    {
      first_name,
      last_name,
      username,
      email,
      password,
    },
    {
      headers: {
        "X-CSRFToken": csrfToken, // Include CSRF token in the headers
      },
    }
  );
};

const getProfile = async () => {
  return axios.get(`${config.API_BASE_URL}/user/profile/get`, {
    withCredentials: true,
  });
};

const getPictureBase64 = async () => {
  return axios.get(`${config.API_BASE_URL}/user/profile/get-picture/`, {
    withCredentials: true,
  });
};

const updateProfile = async (field, updatedValue, token) => {
  return axios.post(`${config.API_BASE_URL}/user/profile/update/`,
    {
      field: field,
      value: updatedValue,
    },
    {
      headers: {
        "X-CSRFToken": token,
      },
    }
  );
};

const updatePicture = async (imagePath, token) => {
  return axios.put(`${config.API_BASE_URL}/user/profile/update-picture/`,
    { newProfilePicUrl: imagePath },
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json", "X-CSRFToken": token },
    }
  );
};

const deletePicture = async (imagePath, token) => {
  return axios.delete(`${config.API_BASE_URL}/user/profile/delete-picture/`, {
            data: { imagePath },
            headers: { 
              "Content-Type": 
              "application/json", 
              "X-CSRFToken": token },
            withCredentials: true
        });
}


const uploadPicture = async () => {

}

const getAllPictures = async () => {

}


export default {
    createUser, getProfile, getPictureBase64, updateProfile, updatePicture, 
    deletePicture, uploadPicture, getAllPictures,
  };
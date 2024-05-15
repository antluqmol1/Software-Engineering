import axios, { AxiosHeaders } from 'axios';
import config from '../config';


const createGame = async (gameId, id, description, gameTitle, token) => {
  return axios.post(
    `${config.API_BASE_URL}/game/create/`,
    { gameid: gameId, id: id, description: description, title: gameTitle },
    {
      headers: {
        "X-CSRFToken": token, // Include CSRF token in headers
      },
    }
  );
};

const getProfilePictures = async (token) => {
    return axios.get(`${config.API_BASE_URL}/game/get-participants-images/`, { }, {
        Headers: {
            'X-CSRFToken': token,  // Include CSRF token in the headers
        },
        withCredentials: true
    });
}

const getParticipants = async (token) => {
    return axios.get(`${config.API_BASE_URL}/game/get-participants/`, { }, {
        Headers: {
            'X-CSRFToken': token,  // Include CSRF token in the headers
        },
        withCredentials: true
    });
}

const getGame = async (token) => {
    return axios.get(`${config.API_BASE_URL}/game/get/`, {
        headers: {
          "X-CSRFToken": token, // Include CSRF token in headers
        }
      });
}

const getCurrentTask = async (token) => {
    return axios.get(`${config.API_BASE_URL}/game/current-task/`, {
          headers: {
            "X-CSRFToken": token, // Include CSRF token in headers
          },
        });
}

const joinGame = async (gameCode, token) => {
  return axios.post(`${config.API_BASE_URL}/game/join/`, { gameid: gameCode }, {
        headers: {
          "X-CSRFToken": token, // Include CSRF token in headers
        },
      });
}


export default {
    createGame, getProfilePictures, getParticipants, getGame, getCurrentTask, joinGame
};
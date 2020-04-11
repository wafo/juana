const { default: axios } = require('axios');
const logger = require('../utils/logger');
const { challengeAnswer } = require('../utils/hash');
// const islands = require('../utils/test-islands.json');

const api = axios.create({
  baseURL: process.env['TURNIP_URL'],
  headers: {
    'user-agent': process.env['USER_AGENT'],
    'content-type': 'application/json',
    origin: process.env['ORIGIN'],
    referer: process.env['REFERER'],
    'x-kpsdk-ct': process.env['X-KPSDK-CT'],
    'x-kpsdk-fp': process.env['X-KPSDK-FP'],
  },
});

api.interceptors.response.use(
  async response => {
    if (response.headers['content-type'].indexOf('application/json') !== -1) {
      return response.data;
    }
    return response;
  },
  error => {
    return Promise.reject(error);
  },
);

function filterIslands(islands, { islandMode, minPrice }) {
  let filtered = islands;
  if (islandMode) {
    filtered = islands.filter(x => x.commerce === islandMode);
  }
  if (minPrice) {
    filtered = islands.filter(x => x.turnipPrice >= Math.abs(minPrice));
  }
  if (minPrice && Math.sign(minPrice) === -1) {
    // If price is negative sort by queue
    filtered = filtered.sort((a, b) => a.queued - b.queued);
  } else {
    // If not sorting by queue sort by price
    filtered = filtered.sort((a, b) => b.turnipPrice - a.turnipPrice);
  }
  return filtered.slice(0, 5);
}

async function getIslands(filters) {
  try {
    const response = await api.get('/islands/', { retry: 0 });
    if (response.success) {
      return filterIslands(response.islands, { ...filters });
    }
  } catch (error) {
    console.error(error);
    logger.error('Problem fetching islands');
  }
}

async function getIsland(turnipCode) {
  try {
    const response = await api.get(`/island/${turnipCode}`);
    if (response.success) {
      return response.islandInfo;
    }
    return null;
  } catch (error) {
    console.error(error);
    logger.error('Problem fetching island');
  }
}

async function checkQueue(turnipCode, visitorID) {
  try {
    const response = await api.get(`/island/queue/${turnipCode}`, {
      params: {
        visitorID,
      },
    });
    if (response.success) {
      return response;
    }
    return null;
  } catch (error) {
    console.error(error);
    logger.error('Problema con el queue');
  }
}

async function challenge() {
  try {
    const response = await api.post(`/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3/challenge`);
    const answer = challengeAnswer(response.answerHash, response.seed);
    return {
      answer,
      challengeID: response.challengeID,
    };
  } catch (error) {
    logger.error('Problem with challenge. Expired uuids?');
    return null;
  }
}

async function enterQueue(turnipCode, visitorID, { challengeID, answer, name }) {
  try {
    const response = await api.put(
      `/island/queue/${turnipCode}`,
      {
        name,
      },
      {
        params: {
          visitorID,
        },
        headers: {
          'x-challenge-answer': answer,
          'x-challenge-id': challengeID,
        },
      },
    );
    if (response.success) {
      return response;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = {
  getIslands,
  getIsland,
  checkQueue,
  challenge,
  enterQueue,
};

const { default: axios } = require('axios');
const logger = require('../logger');
// const islands = require('../test-islands.json');

const api = axios.create({
  baseURL: process.env['TURNIP_URL'],
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36',
    'content-type': 'application/json',
    origin: 'https://turnip.exchange',
    referer: 'https://turnip.exchange/islands',
    'x-kpsdk-ct':
      'T41gNRNorUyyk7fS2VaabA==::KMK5PYcioIYPBZw1pEu6nFOBO4cziAv0O0v80VZrfosQ2HKEm9/rGKWkHEvzqzfS1Mavr9/Ie9QEtj5Xdqz/SlH5Apg7UCVsqvr5r1vq/+zp7WwzeMsUrYb3YqJoCq61Jiu1uyvDB9TmriLNkjEVEx+Ek1QzHr/oj/NuXOjq3mdUhLWR4i9QhC56Nydql97k5fAJ5O58lI9a3NI0+U1UaHuFuOXtFfXwfKTxSBoP6eWDBSZxtF/JuN0H9n9jY2fjJJ8/JmeRsoSbVLk2FscU8fvsgVCkIYxJhBMth2wbxvYXL31hWa11L1SSbYy08HC9nNMLGaW5PWO3Pb154zSt5UpMYl23EfRMrcIDk08HMOSVkDM12OjveKfZp4B/SCXTYYqGUPoYY/GmnBMfiOwgw/btzwARe0mbf3a8Slkcr+099ZUCq8uEVj1yY0gaCEScHRKT97TAcwFrCd01R/UtuVDBfIigcIjcVvOgTqwWusW8QzUhk9v56ghGW+Y6gP/s0kEUicKitYrWcIsoIFAEEA==',
    'x-kpsdk-fp': '11aa3aa6-b4fe-c26c-fb00-55e020a90582',
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
    filtered = islands.filter(x => x.turnipPrice >= minPrice);
  }
  return filtered.sort((a, b) => b.turnipPrice - a.turnipPrice).slice(0, 5);
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

module.exports = {
  getIslands,
};

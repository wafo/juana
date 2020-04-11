const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis);

const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

const userBase = {
  id: '',
  name: '',
  visitorID: null,
  onQueue: false,
  visitingIsland: null,
  suggestedIslands: [],
};

async function addUser(id, name, visitorID) {
  const newUser = {
    ...userBase,
    id: id,
    name: name,
    visitorID: visitorID,
  };
  await client.setAsync(id, JSON.stringify(newUser));
  return newUser;
}

async function getUser(id) {
  const user = await client.getAsync(id);
  return JSON.parse(user);
}

async function updateUserSuggestedIslands(id, islands) {
  const user = await getUser(id);
  await client.setAsync(id, JSON.stringify({ ...user, suggestedIslands: islands }));
  return true;
}

async function getSuggestedIsland(id, index) {
  try {
    const user = await getUser(id);
    const island = user.suggestedIslands[index - 1];
    return island;
  } catch (error) {
    return null;
  }
}

module.exports = {
  addUser,
  getUser,
  updateUserSuggestedIslands,
  getSuggestedIsland,
};

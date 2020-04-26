const redis = require('redis');
const bluebird = require('bluebird');

const hashKey = process.env['REDIS_HASH_KEY'];

bluebird.promisifyAll(redis);

const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

const userBase = {
  id: '',
  name: '',
  firstTimeBuyer: false,
  previousPattern: 4,
  currentPattern: 4,
  previousSellingPrice: 100,
  weekPrices: [
    [null, null],
    [null, null],
    [null, null],
    [null, null],
    [null, null],
    [null, null],
  ],
};

async function addUser(id, name) {
  const newUser = {
    ...userBase,
    id: id,
    name: name,
  };
  await client.hsetAsync(hashKey, id, JSON.stringify(newUser));
  return newUser;
}

async function getUser(id) {
  const user = await client.hgetAsync(hashKey, id);
  return JSON.parse(user);
}

async function resetUser(id, previousSellingPrice, pattern) {
  const user = await getUser(id);

  const resetedUser = {
    ...user,
    firstTimeBuyer: false,
    previousPattern: pattern ? pattern : user.currentPattern,
    currentPattern: 4,
    previousSellingPrice,
    weekPrices: userBase.weekPrices,
  };

  await client.hsetAsync(hashKey, id, JSON.stringify(resetedUser));
  return resetedUser;
}

async function updatePreviousSellingPrice(id, previousSellingPrice) {
  const user = await getUser(id);

  const updatedUser = {
    ...user,
    previousSellingPrice,
  };

  await client.hsetAsync(hashKey, id, JSON.stringify(updatedUser));
  return updatedUser;
}

async function updateCurrentPattern(id, pattern) {
  const user = await getUser(id);

  const updatedUser = {
    ...user,
    currentPattern: pattern,
  };

  await client.hsetAsync(hashKey, id, JSON.stringify(updatedUser));
  return updatedUser;
}

async function updateBuyingPrice(id, day, time, price) {
  const user = await getUser(id);

  const updatedWeekPrices = [...user.weekPrices];
  updatedWeekPrices[day][time] = price;

  const updatedUser = {
    ...user,
    weekPrices: updatedWeekPrices,
  };

  await client.hsetAsync(hashKey, id, JSON.stringify(updatedUser));
  return updatedUser;
}

module.exports = {
  addUser,
  getUser,
  resetUser,
  updatePreviousSellingPrice,
  updateCurrentPattern,
  updateBuyingPrice,
};

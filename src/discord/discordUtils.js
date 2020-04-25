const redis = require('../utils/redis');
const { v4: uuid } = require('uuid');
const moment = require('moment');

const botPrefix = process.env['BOT_PREFIX'];

// Recovers user info from message, adds user to redis, returns user.
async function prepareUser(message) {
  const userId = message.author.id;
  let user = await redis.getUser(userId);
  if (!user) {
    const name = message.author.username;
    user = await redis.addUser(userId, name, uuid());
  }
  return user;
}

// Checks message for arguments and returns params based on them.
async function getParams(message, userId) {
  const params = message.content
    .slice(botPrefix.length)
    .trim()
    .split(' ');

  switch (params[0]) {
    case 'buying':
    case 'selling':
      return {
        mode: 'islands',
        islandMode: params[0],
        minPrice: params[1],
        description: params[2] === 'desc',
      };
    case 'queue': {
      let turnipCode = null;
      if (params[1] && params[1].length > 1) {
        turnipCode = params[1];
      } else if (params[1] && params[1].length === 1) {
        const suggestedIsland = await redis.getSuggestedIsland(userId, params[1]);
        turnipCode = suggestedIsland.turnipCode;
      }
      return {
        mode: 'queue',
        turnipCode,
      };
    }
    case 'help':
    default:
      return {
        mode: 'help',
      };
  }
}

// Prepares long message of islands list
function prepareIslandsMessage(islands, description = false) {
  return islands.reduce((accumulator, island, index) => {
    let line = `**#${index + 1} - ${island.name} [${island.commerce}]**\n`;
    line = line.concat(`**Price:** ${island.turnipPrice}\n`);
    line = line.concat(`**Queue:** ${island.queued}/${island.maxQueue}\n`);
    line = line.concat(`**Time:** ${moment(island.islandTime).format('dddd, DD/MM/YYYY, HH:mm zz')}\n`);
    line = line.concat(`**URL:** https://turnip.exchange/island/${island.turnipCode}\n`);
    if (description) {
      line = line.concat(`**Description:**\n${island.description.replace(/\n\n/gm, '')}\n`);
    }
    line = line.concat('\n');

    return accumulator.concat(line);
  }, '');
}

module.exports = {
  prepareUser,
  getParams,
  prepareIslandsMessage,
};

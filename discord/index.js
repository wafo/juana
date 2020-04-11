const Discord = require('discord.js');
const { turnipExchange: turnipFetcher } = require('../fetcher');
const { turnipSocket } = require('../websocket');
const logger = require('../utils/logger');
const redis = require('../utils/redis');
const moment = require('moment');
const { v4: uuid } = require('uuid');

const tokenDiscord = process.env['DISCORD_TOKEN'];
const botPrefix = process.env['BOT_PREFIX'];

function getParams(message) {
  const params = message.slice(botPrefix.length).trim().split(' ');

  switch (params[0]) {
    case 'buying':
    case 'selling':
      return {
        mode: 'islands',
        islandMode: params[0],
        minPrice: params[1],
        description: params[2] === 'desc',
      };
    case 'queue':
      return {
        mode: 'queue',
        // turnip code from island
        ...(params[1].length > 1 && { turnipCode: params[1] }),
        // index from suggested islands
        ...(params[1].length === 1 && { islandIndex: params[1] }),
      };
    case 'help':
    default:
      return {
        mode: 'help',
      };
  }
}

function prepareIslandsMessage(islands, params) {
  return islands.reduce((accumulator, island, index) => {
    let line = `**#${index + 1} - ${island.name} [${island.commerce}]**\n`;
    line = line.concat(`**Price:** ${island.turnipPrice}\n`);
    line = line.concat(`**Queue:** ${island.queued}/${island.maxQueue}\n`);
    line = line.concat(`**Time:** ${moment(island.islandTime).format('dddd, DD/MM/YYYY, HH:mm zz')}\n`);
    line = line.concat(`**URL:** https://turnip.exchange/island/${island.turnipCode}\n`);
    if (params.description) {
      line = line.concat(`**Description:**\n${island.description.replace(/\n\n/gm, '')}\n`);
    }
    line = line.concat('\n');

    return accumulator.concat(line);
  }, '');
}

function handleSocket() {}

const client = new Discord.Client();

client.on('ready', () => {
  logger.juana('I am ready, mijo!');
});

client.on('message', async message => {
  if (!message.content.startsWith(botPrefix) || message.author.bot) return;

  // Checking redis...
  const userId = message.author.id;
  let user = await redis.getUser(userId);
  if (!user) {
    logger.server('New user, adding to redis.');
    const name = message.author.username;
    user = await redis.addUser(userId, name, uuid());
  }

  // Checking params...
  const params = getParams(message.content);

  switch (params.mode) {
    case 'islands': {
      const waiting = await message.reply('Buscando islas, perame...');
      const islands = await turnipFetcher.getIslands({ ...params });

      if (islands.length) {
        // Message
        const toSend = prepareIslandsMessage(islands, params);
        await waiting.edit(`<@${userId}>, Aquí te van las mejores islas: \n\n`);
        await message.channel.send(toSend, { split: true });
        // Updating redis
        logger.server(`Updating suggested islands for ${userId}.`);
        await redis.updateUserSuggestedIslands(userId, islands);
      } else {
        await waiting.edit(`<@${userId}>, Oh no... parece que no hay islas con ese precio :cry:`);
      }
      break;
    }
    case 'queue': {
      // Setting turnipCode
      let turnipCode = params.turnipCode;
      if (!turnipCode) {
        const suggestedIsland = await redis.getSuggestedIsland(userId, params.islandIndex);
        turnipCode = suggestedIsland.turnipCode;
      }
      // Open socket
      turnipSocket.createSocket(handleSocket, { turnipCode, visitorID: user.visitorID, userId: user.id });
      // Cheking island
      const island = await turnipFetcher.getIsland(turnipCode);
      if (island) {
        const queue = await turnipFetcher.checkQueue(turnipCode, user.visitorID);
        if (queue) {
          const answer = await turnipFetcher.challenge(uuid(), uuid());
          const enter = await turnipFetcher.enterQueue(turnipCode, user.visitorID, {
            challengeID: answer.challengeID,
            answer: answer.answer,
            name: user.name,
          });
          if (enter) {
            await message.reply('Todo en orden, estas en la cola. Te mantendré informado por DM');
          }
        }
        return;
      }
      await message.reply('Oh no, parece que la isla no esta disponible :cry:');
      break;
    }
    case 'help':
    default:
      // Help message
      await message.reply('Ups, no entendí tú mensaje. Tal vez esto te ayude: ...');
      break;
  }
});

client.on('error', error => {
  console.error(error);
});

if (tokenDiscord) {
  logger.server('Initializing Juana');
  client.login(tokenDiscord);
} else {
  logger.error('DISCORD_TOKEN not available');
  process.exit();
}

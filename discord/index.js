const Discord = require('discord.js');
const { v4: uuid } = require('uuid');
const { turnipFetcher } = require('../fetcher');
const { turnipSocket } = require('../websocket');
const redis = require('../utils/redis');
const discord = require('./discordUtils');
const logger = require('../utils/logger');

const tokenDiscord = process.env['DISCORD_TOKEN'];
const botPrefix = process.env['BOT_PREFIX'];

function handleSocket() {}

const client = new Discord.Client();

client.on('ready', () => {
  logger.juana('I am ready, mijo!');
});

client.on('message', async message => {
  if (!message.content.startsWith(botPrefix) || message.author.bot) return;

  const user = await discord.prepareUser(message);
  const params = await discord.getParams(message, user.id);

  switch (params.mode) {
    case 'islands': {
      const waiting = await message.reply('Buscando islas, perame...');
      const islands = await turnipFetcher.getIslands({ ...params });
      if (islands.length) {
        const toSend = discord.prepareIslandsMessage(islands, !!params.description);
        await waiting.edit(`<@${user.id}>, Aquí te van las mejores islas: \n\n`);
        await message.channel.send(toSend, { split: true });
        await redis.updateUserSuggestedIslands(user.id, islands);
      } else {
        await waiting.edit(`<@${user.id}>, Oh no... parece que no hay islas con ese precio :cry:`);
      }
      return;
    }
    case 'queue': {
      if (!params.turnipCode) break;
      turnipSocket.createSocket(handleSocket, { turnipCode: params.turnipCode, visitorID: user.visitorID, userId: user.id });

      const island = await turnipFetcher.getIsland(params.turnipCode);
      if (!island) break;

      const queue = await turnipFetcher.checkQueue(params.turnipCode, user.visitorID);
      if (!queue) break;

      const challengeAnswer = await turnipFetcher.challenge();
      const enterQueue = await turnipFetcher.enterQueue({
        turnipCode: params.turnipCode,
        visitorID: user.visitorID,
        challengeID: challengeAnswer.challengeID,
        answer: challengeAnswer.answer,
        name: user.name,
      });
      if (!enterQueue) break;

      await message.reply('Todo en orden, estas en la cola. Te mantendré informado por DM');
      return;
    }
    case 'help':
    default:
      await message.reply('Ups, no entendí tú mensaje. Tal vez esto te ayude: ...');
      return;
  }

  await message.reply('Ups, hubo un problema con tu petición.');
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

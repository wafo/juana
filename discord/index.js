const Discord = require('discord.js');
const { turnipFetcher } = require('../fetcher');
const { turnipSocket } = require('../websocket');
const redis = require('../utils/redis');
const discord = require('./discordUtils');
const logger = require('../utils/logger');

const tokenDiscord = process.env['DISCORD_TOKEN'];
const botPrefix = process.env['BOT_PREFIX'];

async function handleSocket({ id, message }) {
  try {
    const user = await client.users.fetch(id);
    user.send(message);
  } catch (error) {
    console.error(error);
  }
}

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
      if (!island || island.locked || island.paused) break;
      await redis.updateVisitingIsland(user.id, island);

      const checkQueue = await turnipFetcher.checkQueue(params.turnipCode, user.visitorID);
      if (!checkQueue) break;

      const challengeAnswer = await turnipFetcher.challenge();
      const queue = await turnipFetcher.enterQueue({
        turnipCode: params.turnipCode,
        visitorID: user.visitorID,
        challengeID: challengeAnswer.challengeID,
        answer: challengeAnswer.answer,
        name: user.name,
      });
      if (!queue) break;
      await redis.updateQueue(user.id, queue.$id);

      await message.reply(`Estas en el lugar ${queue.yourPlace} de ${queue.maxQueue}. Te mantendré informado por DM`);

      // TODO:
      // Confirmation when you receive the PIN
      // How to alert that you're finish

      return;
    }
    case 'help':
    default:
      await message.reply('Ups, no entendí tú mensaje. Tal vez esto te ayude: ...');
      return;
  }

  // await handleSocket({ id: user.id, message: 'Ups, no entendí tú mensaje. Tal vez esto te ayude: ...' });
  await message.reply('Ups, hubo un problema con tu petición');
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

const Discord = require('discord.js');
const discord = require('./discordUtils');
const redis = require('../utils/redis');
const logger = require('../utils/logger');

const tokenDiscord = process.env['DISCORD_TOKEN'];
const botPrefix = process.env['BOT_PREFIX'];

const client = new Discord.Client();

client.on('ready', () => {
  logger.juana('Estoy lista para hacer unas predicciones!');
});

client.on('message', async message => {
  try {
    if (!message.content.startsWith(botPrefix) || message.author.bot) return;

    const user = await discord.prepareUser(message);
    const params = await discord.getParams(message, user.id);

    switch (params.mode) {
      case 'buying': {
        await redis.updateBuyingPrice(user.id, params.day, params.time, params.price);
        break;
      }
      case 'selling': {
        await redis.updatePreviousSellingPrice(user.id, params.price);
        break;
      }
      case 'newweek':
      case 'reset': {
        await redis.resetUser(user.id, params.price, params.pattern);
        break;
      }
      case 'me': {
        break;
      }
      case 'help':
      default: {
        const helpMessage = discord.helpMessage();
        message.reply(helpMessage);
        return;
      }
    }

    const { message: patternMessage, graphAttachment } = await discord.patternMessage(user.id);
    message.reply(patternMessage, graphAttachment);
  } catch (error) {
    message.reply('hubo un problema o no te entendi :sweat_smile:\nPrueba con !juana help');
    console.error(error);
  }
});

client.on('error', error => {
  logger.error('Error on discord client');
  console.error(error);
});

if (tokenDiscord) {
  logger.server('Initializing Juana');
  client.login(tokenDiscord);
} else {
  logger.error('DISCORD_TOKEN not available');
  // TODO: Remove this when discord it's not the only method of i/o
  process.exit();
}

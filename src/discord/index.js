const Discord = require('discord.js');
const logger = require('../utils/logger');
const { calculateOutput } = require('../predictor');

// Temporal
const user = {
  firstTimeBuyer: false,
  previousPattern: 2,
  previousSellingPrice: 106,
  weekPrices: [
    [92, 87],
    [85, 82],
    [77, 72],
    [68, 64],
    [59, 54],
    [51, 45],
  ],
};

const tokenDiscord = process.env['DISCORD_TOKEN'];
const botPrefix = process.env['BOT_PREFIX'];

const client = new Discord.Client();

client.on('ready', () => {
  logger.juana('Estoy lista para hacer unas predicciones!');
});

client.on('message', async message => {
  if (!message.content.startsWith(botPrefix) || message.author.bot) return;

  // TODO: Change this to new functions
  // const user = await discord.prepareUser(message);
  // const params = await discord.getParams(message, user.id);

  // TODO: React to params.

  const { graph } = await calculateOutput(user.firstTimeBuyer, user.previousPattern, user.previousSellingPrice, user.weekPrices);
  const attachment = new Discord.MessageAttachment(graph);

  message.reply('Aqui te va una imagen', attachment);

  // message.reply('Ups, hubo un problema con tú petición');
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

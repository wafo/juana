const Discord = require('discord.js');
const discord = require('./discordUtils');
const { calculateOutput } = require('../predictor');
const logger = require('../utils/logger');

// Temporal
const user = {
  firstTimeBuyer: false,
  previousPattern: 4,
  previousSellingPrice: 106,
  weekPrices: [
    [92, 115],
    [NaN, NaN],
    [NaN, NaN],
    [NaN, NaN],
    [NaN, NaN],
    [NaN, NaN],
  ],
  /* weekPrices: [
    [92, 87],
    [85, 82],
    [77, 72],
    [68, 64],
    [59, 54],
    [51, 45],
  ], */
};

const tokenDiscord = process.env['DISCORD_TOKEN'];
const botPrefix = process.env['BOT_PREFIX'];

const client = new Discord.Client();

client.on('ready', () => {
  logger.juana('Estoy lista para hacer unas predicciones!');
});

client.on('message', async message => {
  try {
    if (!message.content.startsWith(botPrefix) || message.author.bot) return;

    // TODO: Change this to new functions
    // const user = await discord.prepareUser(message);
    // const params = await discord.getParams(message, user.id);

    // TODO: React to params.

    const { graph, patterns } = await calculateOutput(
      user.firstTimeBuyer,
      user.previousPattern,
      user.previousSellingPrice,
      user.weekPrices,
    );

    const patternMsg = discord.preparePatternMessage(patterns);

    const graphAttachment = new Discord.MessageAttachment(graph);
    message.reply(patternMsg, graphAttachment);
  } catch (error) {
    message.reply('Hubo un error. ¿Estan bien tus valores?');
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

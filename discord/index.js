const Discord = require('discord.js');
const { turnipExchange } = require('../fetcher');
const logger = require('../logger');
const moment = require('moment');

const tokenDiscord = process.env['DISCORD_TOKEN'];
const botPrefix = process.env['BOT_PREFIX'];

function getParams(message) {
  const params = message.slice(botPrefix.length).trim().split(' ');
  return {
    islandMode: params[0],
    minPrice: params[1],
    description: params[2] === 'desc',
  };
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

const client = new Discord.Client();

client.on('ready', () => {
  logger.juana('I am ready, mijo!');
});

client.on('message', async message => {
  if (!message.content.startsWith(botPrefix) || message.author.bot) return;
  const params = getParams(message.content);

  const waiting = await message.reply('Buscando islas, perame...');
  const islands = await turnipExchange.getIslands({ ...params });
  waiting.delete();

  if (islands.length) {
    const toSend = prepareIslandsMessage(islands, params);
    await message.reply('Aquí te van las mejores islas: \n\n');
    await message.channel.send(toSend, { split: true });
  } else {
    await message.reply('Oh no... parece que no hay islas con ese precio :cry:');
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

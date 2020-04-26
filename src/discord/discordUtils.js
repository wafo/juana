const Discord = require('discord.js');
const redis = require('../utils/redis');
const { calculateOutput } = require('../predictor');

const weekDays = {
  lunes: 0,
  martes: 1,
  miercoles: 2,
  jueves: 3,
  viernes: 4,
  sabado: 5,
};

const timeStrings = {
  AM: 0,
  am: 0,
  PM: 1,
  pm: 1,
};

const botPrefix = process.env['BOT_PREFIX'];

// Recovers user info from message, adds user to redis, returns user.
async function prepareUser(message) {
  const userId = message.author.id;
  let user = await redis.getUser(userId);
  if (!user) {
    const name = message.author.username;
    user = await redis.addUser(userId, name);
  }
  return user;
}

// Checks message for arguments and returns params based on them.
async function getParams(message) {
  const params = message.content
    .slice(botPrefix.length)
    .trim()
    .split(' ');

  switch (params[0]) {
    case 'reset':
    case 'selling':
      if (!params[1]) {
        throw new Error();
      }

      return {
        mode: params[0],
        price: params[1],
        pattern: params[2],
      };
    case 'buying': {
      if (!params[1] || !params[2] || !params[3]) {
        throw new Error();
      }
      const day = Number.isInteger(params[1]) ? params[1] - 1 : weekDays[params[1]];

      return {
        mode: 'buying',
        day,
        time: timeStrings[params[2]],
        price: params[3],
      };
    }
    case 'me':
      return {
        mode: 'me',
      };
    case 'help':
    default:
      return {
        mode: 'help',
      };
  }
}

async function patternMessage(id) {
  const user = await redis.getUser(id);

  const {
    graph,
    patterns: { mostLikely, average },
  } = await calculateOutput(user.firstTimeBuyer, user.previousPattern, user.previousSellingPrice, user.weekPrices);

  await redis.updateCurrentPattern(user.id, mostLikely.pattern_number);

  const graphAttachment = new Discord.MessageAttachment(graph);

  const percent = Number.isFinite(mostLikely.probability) ? (mostLikely.probability * 100).toPrecision(3) : '';

  let msg = `estas son las predicciones:\n`;
  msg = msg.concat(`**Patrón más probable:** ${mostLikely.pattern_description} con ${percent}%\n`);
  msg = msg.concat(`**Mínimo garantizado:** ${average.weekGuaranteedMinimum}\n`);
  msg = msg.concat(`**Máximo potencial:** ${average.weekMax}\n`);
  msg = msg.concat('\n');

  return {
    message: msg,
    graphAttachment,
  };
}

module.exports = {
  prepareUser,
  getParams,
  patternMessage,
};

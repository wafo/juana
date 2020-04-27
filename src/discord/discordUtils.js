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
    .toLowerCase()
    .split(' ');

  switch (params[0]) {
    case 'newweek':
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
  msg = msg.concat(`**Máximo: ** Potencial: ${average.weekMax} | Patrón: ${mostLikely.weekMax}\n`);
  msg = msg.concat('\n');

  return {
    message: msg,
    graphAttachment,
  };
}

function helpMessage() {
  let msg = `estos son los comandos disponibles:\n\n`;
  msg = msg.concat(`**!juana me**\n`);
  msg = msg.concat(`Retorna tú predicción actual.\n\n`);
  msg = msg.concat(`**!juana buying [día] [tiempo] [precio]**\n`);
  msg = msg.concat(
    `Registra tu precio de compra. Usalo para registrar los precios de toda tú semana, mientras mas registes, más exacta la predicción.\n`,
  );
  msg = msg.concat(`Los dias de la semana deben ir sin tildes, jeje.\n`);
  msg = msg.concat(`*Ejemplo: !juana buying lunes am 115*\n\n`);
  msg = msg.concat(`**!juana selling [precio]**\n`);
  msg = msg.concat(
    `Actualiza el precio de venta del último domingo. Este dato es muy importante para la predicción!\n`,
  );
  msg = msg.concat(`*Ejemplo !juana selling 90*\n\n`);
  msg = msg.concat(`**!juana newweek [precio] [patrón]**\n`);
  msg = msg.concat(
    `Reinicia completamente tú semana y actualiza el precio de venta del último domingo, así como el patrón de la semana pasada (opcional).\n`,
  );
  msg = msg.concat(`Si no especificas patrón, automáticamente se toma el de la semana pasada.\n`);
  msg = msg.concat(`*Ejemplo: !juana newweek 90 3*\n\n`);
  msg = msg.concat(`**Patrones:**\n`);
  msg = msg.concat('```');
  msg = msg.concat(`0: Fluctuante\n`);
  msg = msg.concat(`1: Pico alto\n`);
  msg = msg.concat(`2: Decreciente\n`);
  msg = msg.concat(`3: Pico moderado\n`);
  msg = msg.concat(`4: Desconocido\n`);
  msg = msg.concat('```');
  msg = msg.concat(`\n`);

  return msg;
}

module.exports = {
  prepareUser,
  getParams,
  patternMessage,
  helpMessage,
};

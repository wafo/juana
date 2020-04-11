const WebSocket = require('ws');
const logger = require('../utils/logger');
const redis = require('../utils/redis');

// TODO:
// > Handle createSocket errors...
// > Add user id to socket...

const wsUrl = process.env['TURNIP_WS'];

function socketOnOpen(ws, { turnipCode, visitorID }) {
  ws.send(
    JSON.stringify({
      action: 'join',
      turnipCode,
      visitorID,
    }),
  );
}

async function socketOnMessage(ws, data, socketCallback) {
  const dataObj = JSON.parse(data);

  switch (dataObj.action) {
    case 'joined':
      logger.socket(`[${ws.userId}] connected to ${ws.turnipCode}`);
      break;
    case 'queueUpdated':
      break;
    case 'islandUpdated': {
      let message = `**Hubo un update:**\n`;
      message = message.concat(`**Cerrada:** ${!!dataObj.data.locked}\n`);
      message = message.concat(`**En pausa:** ${!!dataObj.data.paused}\n`);
      message = message.concat(`**Descripción:** ${dataObj.data.description}`);

      await socketCallback({
        id: ws.userId,
        message,
      });
      break;
    }
    case 'alert':
      break;
    case 'kick': {
      let message = `**Oh no, te sacaron de la cola :cry:**\n`;
      message = message.concat('Por alguna razón el dueño de la isla te saco de la cola.');

      await socketCallback({
        id: ws.userId,
        message,
      });

      await redis.cleanUser();
      ws.close();

      break;
    }
    default:
      break;
  }
}

function createSocket(socketCallback, { turnipCode, visitorID, userId }) {
  try {
    if (!wsUrl) {
      logger.error('TURNIP_WS not available');
      return null;
    }

    const ws = new WebSocket(wsUrl);
    ws.turnipCode = turnipCode;
    ws.visitorID = visitorID;
    ws.userId = userId;

    ws.on('open', () => socketOnOpen(ws, { turnipCode, visitorID }));
    ws.on('message', data => socketOnMessage(ws, data, socketCallback));
    ws.on('error', f => f);
    // TODO: Alert or send message if socket ded.

    return ws;
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  createSocket,
};

const WebSocket = require('ws');
const logger = require('../utils/logger');

// TODO:
// > Handle createSocket errors...
// > Add user id to socket...

const wsUrl = process.env['TURNIP_WS'];

function socketOnOpen(ws, { turnipCode, visitorID }) {
  logger.socket('Connection opened');

  const join = {
    action: 'join',
    turnipCode,
    visitorID,
  };

  ws.send(JSON.stringify(join));
}

function socketOnMessage(ws, data, socketCallback) {
  const dataObj = JSON.parse(data);

  switch (dataObj.action) {
    case 'joined':
      logger.socket(`[${ws.userId}] connected to ${ws.turnipCode}`);
      break;
    case 'queueUpdated':
      break;
    case 'islandUpdated':
      break;
    case 'alert':
      break;
    case 'kick':
      break;
    default:
      break;
  }
}

function createSocket(socketCallback, { turnipCode, visitorID, userId }) {
  try {
    logger.socket('Opening connection');
    if (!wsUrl) {
      logger.error('TURNIP_WSs not available');
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

// createSocket('defaf24a');

module.exports = {
  createSocket,
};

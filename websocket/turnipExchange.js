const WebSocket = require('ws');
const logger = require('../utils/logger');

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

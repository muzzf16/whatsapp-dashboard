const logger = require('../utils/logger');
const sessionManager = require('./sessionManager');
const axios = require('axios');

const initWhatsApp = (io) => {
  // You might want to load existing sessions from a database here
};

const sendMessage = async (sessionId, to, message) => {
  const session = sessionManager.getSession(sessionId);
  if (!session || session.connectionStatus !== 'connected') {
    throw new Error(`Session ${sessionId} is not connected.`);
  }

  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  return await session.sock.sendMessage(jid, { text: message });
};

const sendMediaMessage = async (sessionId, to, message, mediaUrl, mediaType, mediaBuffer = null) => {
  const session = sessionManager.getSession(sessionId);
  if (!session || session.connectionStatus !== 'connected') {
    throw new Error(`Session ${sessionId} is not connected.`);
  }

  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;

  let buffer;
  if (mediaBuffer) {
    buffer = mediaBuffer;
  } else {
    const response = await axios({ url: mediaUrl, responseType: 'arraybuffer' });
    buffer = Buffer.from(response.data);
  }

  let mediaMessage;
  if (mediaType === 'image') {
    mediaMessage = { image: buffer, caption: message || '' };
  } else if (mediaType === 'document') {
    const fileName = mediaUrl ? mediaUrl.split('/').pop() || 'document' : 'document';
    mediaMessage = { document: buffer, fileName: fileName, caption: message || '' };
  } else {
    throw new Error('Unsupported media type');
  }

  return await session.sock.sendMessage(jid, mediaMessage);
};

const getStatus = (sessionId) => {
  const session = sessionManager.getSession(sessionId);
  return { status: session ? session.connectionStatus : 'disconnected' };
};

const getQRCode = (sessionId) => {
  const session = sessionManager.getSession(sessionId);
  return { qr: session ? session.qrCodeData : null };
};

const getMessages = (sessionId) => {
  const session = sessionManager.getSession(sessionId);
  return { messages: session ? [...session.messageLogs] : [] };
};

const startNewSession = (sessionId, io) => {
  let session = sessionManager.getSession(sessionId);
  if (!session) {
    session = sessionManager.createSession(sessionId);
  }
  sessionManager.startSession(sessionId, io);
  return session;
};

const disconnectWhatsApp = async (sessionId) => {
    const session = sessionManager.getSession(sessionId);
    if (session && session.sock) {
        await session.sock.logout();
        await sessionManager.deleteSession(sessionId);
    }
};

const sendBroadcastFromFile = async (sessionId, numbers, message, delay) => {
    const session = sessionManager.getSession(sessionId);
    if (!session || session.connectionStatus !== 'connected') {
        logger.error(`Session ${sessionId} is not connected. Cannot send broadcast.`);
        return;
    }

    logger.info(`Starting broadcast for session ${sessionId} to ${numbers.length} numbers with a delay of ${delay} seconds.`);

    for (let i = 0; i < numbers.length; i++) {
        const number = numbers[i];
        try {
            await sendMessage(sessionId, number, message);
            logger.info(`Broadcast message sent to ${number} in session ${sessionId}`);
        } catch (error) {
            logger.error(`Failed to send broadcast message to ${number} in session ${sessionId}`, { error: error.message });
        }

        // Wait for the specified delay
        if (i < numbers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
        }
    }

    logger.info(`Broadcast finished for session ${sessionId}.`);
};

module.exports = {
  initWhatsApp,
  sendMessage,
  sendMediaMessage,
  getStatus,
  getQRCode,
  getMessages,
  startNewSession,
  disconnectWhatsApp,
  sendBroadcastFromFile,
};

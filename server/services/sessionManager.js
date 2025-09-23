const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const logger = require('../utils/logger');

const sessions = new Map();

const createSession = (sessionId) => {
  const session = {
    id: sessionId,
    sock: null,
    qrCodeData: null,
    connectionStatus: 'disconnected',
    messageLogs: [],
  };

  sessions.set(sessionId, session);
  return session;
};

const getSession = (sessionId) => {
  return sessions.get(sessionId);
};

const deleteSession = (sessionId) => {
  sessions.delete(sessionId);
};

const startSession = async (sessionId, io) => {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const { state, saveCreds } = await useMultiFileAuthState(`auth_info_baileys_${sessionId}`);
  const { version } = await fetchLatestBaileysVersion();

  session.sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger.child({ module: 'baileys', session: sessionId }),
  });

  session.sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.qrCodeData = qr;
      session.connectionStatus = 'waiting for QR scan';
      const qrUrl = await qrcode.toDataURL(qr);
      io.emit('qr_code', { sessionId, qrUrl });
      io.emit('status', { sessionId, status: session.connectionStatus });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      session.connectionStatus = 'disconnected';
      io.emit('status', { sessionId, status: session.connectionStatus });

      if (shouldReconnect) {
        startSession(sessionId, io);
      } else {
        io.emit('status', { sessionId, status: 'logged out' });
      }
    } else if (connection === 'open') {
      session.connectionStatus = 'connected';
      session.qrCodeData = null;
      io.emit('status', { sessionId, status: session.connectionStatus });
      io.emit('qr_code', { sessionId, qrUrl: null });
    }
  });

  session.sock.ev.on('creds.update', saveCreds);

  session.sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && m.type === 'notify') {
      const sender = msg.key.remoteJid;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'No text content';
      const log = { from: sender, text, timestamp: new Date().toISOString() };

      session.messageLogs.unshift(log);
      if (session.messageLogs.length > 100) session.messageLogs.pop();

      io.emit('new_message', { sessionId, log });
    }
  });
};

module.exports = {
  createSession,
  getSession,
  deleteSession,
  startSession,
};

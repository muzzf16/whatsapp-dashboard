const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const logger = require('../utils/logger');
const axios = require('axios');
const configService = require('./configService');

const fs = require('fs').promises;
const path = require('path');

const sessions = new Map();

async function callWebhook(payload) {
  const webhookUrl = await configService.getWebhookUrl();
  if (!webhookUrl) {
    return;
  }

  logger.info(`[WEBHOOK] Sending to: ${webhookUrl}`);
  try {
    await axios.post(webhookUrl, payload, { headers: { 'Content-Type': 'application/json' } });
    logger.info(`[WEBHOOK] Successfully sent payload.`);
  } catch (error) {
    logger.error(`[WEBHOOK] Error sending payload:`, error.message);
  }
}

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

const deleteSession = async (sessionId) => {
  const authPath = path.join(process.cwd(), `auth_info_baileys_${sessionId}`);
  try {
    await fs.rm(authPath, { recursive: true, force: true });
    logger.info(`Authentication directory for session ${sessionId} deleted`);
  } catch (error) {
    logger.error(`Error deleting authentication directory for session ${sessionId}`, error);
  }
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

      // Trigger webhook
      const webhookPayload = {
        sessionId,
        from: sender,
        text,
        timestamp: log.timestamp,
        originalMessage: msg
      };
      await callWebhook(webhookPayload);
    }
  });
};

module.exports = {
  createSession,
  getSession,
  deleteSession,
  startSession,
};

const sessionManager = require('./sessionManager');

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

const disconnectWhatsApp = (sessionId) => {
    const session = sessionManager.getSession(sessionId);
    if (session && session.sock) {
        session.sock.logout();
        sessionManager.deleteSession(sessionId);
    }
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
};

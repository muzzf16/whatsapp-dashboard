const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    MessageRetryMap
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const configService = require('./configService');
const logger = require('../utils/logger');

let sock;
let io;
let qrCodeData;
let connectionStatus = 'disconnected';
const messageLogs = [];
const AUTH_DIR = 'auth_info_baileys';

// Function to call webhook with improved error handling
async function callWebhook(payload) {
    const webhookUrl = await configService.getWebhookUrl();
    if (!webhookUrl) {
        logger.info('Webhook URL not set, skipping webhook call');
        return;
    }
    
    logger.info(`Sending webhook to: ${webhookUrl}`);
    
    try {
        const response = await axios.post(webhookUrl, payload, { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000 // 5 second timeout
        });
        logger.info(`Webhook sent successfully. Status: ${response.status}`);
    } catch (error) {
        logger.error(`Error sending webhook:`, {
            message: error.message,
            url: webhookUrl,
            payload: payload
        });
    }
}

const initWhatsApp = (socketIo) => {
    io = socketIo;
    connectToWhatsApp();
};

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: logger.child({ module: 'baileys' }),
            msgRetryCounterMap: MessageRetryMap,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            browser: ['WhatsApp Dashboard', 'Chrome', '1.0.0']
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            logger.info('Connection update received', { connection, lastDisconnect, qr: !!qr });

            if (qr) {
                qrCodeData = qr;
                connectionStatus = 'waiting for QR scan';
                logger.info('QR code generated, waiting for scan');
                
                try {
                    const qrUrl = await qrcode.toDataURL(qr);
                    io.emit('qr_code', qrUrl);
                    io.emit('status', connectionStatus);
                } catch (err) {
                    logger.error('Failed to generate QR code URL', err);
                }
            }

            // Handle connection states
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                connectionStatus = 'disconnected';
                logger.info(`Connection closed. Should reconnect: ${shouldReconnect}`);
                
                io.emit('status', connectionStatus);
                
                if (shouldReconnect) {
                    logger.info('Reconnecting to WhatsApp...');
                    connectToWhatsApp();
                } else {
                    logger.info('Logged out from WhatsApp');
                    io.emit('status', 'logged out');
                }
            } else if (connection === 'open') {
                connectionStatus = 'connected';
                qrCodeData = null;
                logger.info('Successfully connected to WhatsApp - Connection is open');
                
                io.emit('status', connectionStatus);
                io.emit('qr_code', null);
            } else if (connection === 'connecting') {
                // Only update status if we're not already in a more specific state
                if (connectionStatus !== 'waiting for QR scan') {
                    connectionStatus = 'connecting';
                    logger.info('Connecting to WhatsApp...');
                    io.emit('status', connectionStatus);
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.key.fromMe && m.type === 'notify') {
                const sender = msg.key.remoteJid;
                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || 'No text content';
                const log = { from: sender, text, timestamp: new Date().toISOString() };
                
                messageLogs.unshift(log);
                if (messageLogs.length > 100) messageLogs.pop();
                
                logger.info('New message received', { sender, text });
                
                // Emit to all connected clients
                io.emit('new_message', log);
                logger.info('Emitted new_message event to clients');

                const webhookPayload = {
                    event: 'new_message',
                    sender: sender.split('@')[0],
                    message: text,
                    timestamp: log.timestamp,
                    originalMessage: msg
                };
                
                await callWebhook(webhookPayload);
            }
        });
    } catch (error) {
        logger.error('Error initializing WhatsApp connection', error);
        connectionStatus = 'disconnected';
        io.emit('status', connectionStatus);
    }
}

const sendMessage = async (to, message) => {
    if (connectionStatus !== 'connected' || !sock) {
        const error = new Error('WhatsApp is not connected.');
        logger.error('Attempt to send message while disconnected', { 
            connectionStatus, 
            sockExists: !!sock 
        });
        throw error;
    }
    
    try {
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        logger.info('Sending message', { to: jid, message });
        
        const result = await sock.sendMessage(jid, { text: message });
        logger.info('Message sent successfully', { messageId: result?.key?.id });
        
        return result;
    } catch (error) {
        logger.error('Error sending message', { 
            error: error.message, 
            to,
            message
        });
        throw error;
    }
};

// Send reply message
const sendReplyMessage = async (to, message, quotedMessage) => {
    if (connectionStatus !== 'connected' || !sock) {
        const error = new Error('WhatsApp is not connected.');
        logger.error('Attempt to send reply message while disconnected', { 
            connectionStatus, 
            sockExists: !!sock 
        });
        throw error;
    }
    
    try {
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        logger.info('Sending reply message', { to: jid, message });
        
        // Send message with quoted message reference
        const result = await sock.sendMessage(jid, { text: message }, { quoted: quotedMessage });
        logger.info('Reply message sent successfully', { messageId: result?.key?.id });
        
        return result;
    } catch (error) {
        logger.error('Error sending reply message', { 
            error: error.message, 
            to,
            message
        });
        throw error;
    }
};

// Send media message (image/document)
const sendMediaMessage = async (to, message, mediaUrl, mediaType) => {
    if (connectionStatus !== 'connected' || !sock) {
        const error = new Error('WhatsApp is not connected.');
        logger.error('Attempt to send media message while disconnected', { 
            connectionStatus, 
            sockExists: !!sock 
        });
        throw error;
    }
    
    try {
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        logger.info('Sending media message', { to: jid, mediaUrl, mediaType });
        
        // Download media file first
        const response = await axios({
            url: mediaUrl,
            responseType: 'arraybuffer'
        });
        
        const buffer = Buffer.from(response.data);
        
        let mediaMessage;
        if (mediaType === 'image') {
            mediaMessage = {
                image: buffer,
                caption: message || ''
            };
        } else if (mediaType === 'document') {
            // Extract filename from URL
            const fileName = mediaUrl.split('/').pop() || 'document';
            mediaMessage = {
                document: buffer,
                fileName: fileName,
                caption: message || ''
            };
        } else {
            throw new Error('Unsupported media type');
        }
        
        const result = await sock.sendMessage(jid, mediaMessage);
        logger.info('Media message sent successfully', { messageId: result?.key?.id });
        
        return result;
    } catch (error) {
        logger.error('Error sending media message', { 
            error: error.message, 
            to,
            mediaUrl,
            mediaType
        });
        throw error;
    }
};

const getStatus = () => ({ status: connectionStatus });
const getQRCode = () => ({ qr: qrCodeData });
const getMessages = () => ({ messages: [...messageLogs] }); // Return a copy of the array

// Function to manually refresh connection status
const refreshConnectionStatus = async () => {
    if (sock) {
        try {
            // Try to get the current connection state
            const state = sock.ws?.opened;
            if (state) {
                logger.info('Connection state check', { state });
                if (connectionStatus !== 'connected') {
                    connectionStatus = 'connected';
                    io.emit('status', connectionStatus);
                }
            }
        } catch (error) {
            logger.error('Error checking connection state', error);
        }
    }
    return { status: connectionStatus };
};

// Function to disconnect WhatsApp
const disconnectWhatsApp = async () => {
    try {
        if (sock) {
            await sock.logout();
            sock = null;
        }
        
        // Delete auth directory
        const authPath = path.join(process.cwd(), AUTH_DIR);
        try {
            await fs.rm(authPath, { recursive: true, force: true });
            logger.info('Authentication directory deleted');
        } catch (error) {
            logger.error('Error deleting authentication directory', error);
        }
        
        connectionStatus = 'disconnected';
        qrCodeData = null;
        io.emit('status', connectionStatus);
        io.emit('qr_code', null);
        
        logger.info('WhatsApp disconnected and auth files deleted');
        return { status: 'success', message: 'Disconnected successfully' };
    } catch (error) {
        logger.error('Error disconnecting WhatsApp', error);
        return { status: 'error', message: 'Failed to disconnect' };
    }
};

// Function to reconnect WhatsApp
const reconnectWhatsApp = async () => {
    try {
        if (connectionStatus !== 'disconnected') {
            await disconnectWhatsApp();
        }
        
        connectToWhatsApp();
        logger.info('Reconnection initiated');
        return { status: 'success', message: 'Reconnection initiated' };
    } catch (error) {
        logger.error('Error reconnecting WhatsApp', error);
        return { status: 'error', message: 'Failed to reconnect' };
    }
};

module.exports = {
    initWhatsApp,
    sendMessage,
    sendReplyMessage,
    sendMediaMessage,
    getStatus,
    getQRCode,
    getMessages,
    refreshConnectionStatus,
    disconnectWhatsApp,
    reconnectWhatsApp
};

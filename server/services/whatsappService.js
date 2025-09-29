const logger = require('../utils/logger');
const sessionManager = require('./sessionManager');
const axios = require('axios');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');
const configService = require('./configService'); // BARU: Import config service

let sock;
let io;
let qrCodeData;
let connectionStatus = 'disconnected';
const messageLogs = [];

// MODIFIKASI: Fungsi callWebhook sekarang menggunakan configService
async function callWebhook(payload) {
    const webhookUrl = await configService.getWebhookUrl(); // Mengambil URL dari config.json
    if (!webhookUrl) {
        return;
    }
    console.log(`[WEBHOOK] Sending to: ${webhookUrl}`);
    try {
        await axios.post(webhookUrl, payload, { headers: { 'Content-Type': 'application/json' } });
        console.log(`[WEBHOOK] Successfully sent payload.`);
    } catch (error) {
        console.error(`[WEBHOOK] Error sending payload:`, error.message);
    }
}

const initWhatsApp = (socketIo) => {
    io = socketIo;
    connectToWhatsApp();
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodeData = qr;
            connectionStatus = 'waiting for QR scan';
            try {
                const qrUrl = await qrcode.toDataURL(qr);
                io.emit('qr_code', qrUrl);
                io.emit('status', connectionStatus);
            } catch (err) {
                console.error('Failed to generate QR code URL', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            connectionStatus = 'disconnected';
            io.emit('status', connectionStatus);
            if (shouldReconnect) {
                connectToWhatsApp();
            } else {
                io.emit('status', 'logged out');
            }
        } else if (connection === 'open') {
            connectionStatus = 'connected';
            qrCodeData = null;
            io.emit('status', connectionStatus);
            io.emit('qr_code', null);
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
            
            io.emit('new_message', log);

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
}

const sendMessage = async (to, message) => {
    if (connectionStatus !== 'connected' || !sock) {
        throw new Error('WhatsApp is not connected.');
    }
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
};

const getStatus = () => ({ status: connectionStatus });
const getQRCode = () => ({ qr: qrCodeData });
const getMessages = () => ({ messages: messageLogs });

module.exports = {
    initWhatsApp,
    sendMessage,
    getStatus,
    getQRCode,
    getMessages,
};

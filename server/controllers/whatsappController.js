const whatsappService = require('../services/whatsappService');
const configService = require('../services/configService');
const qrcode = require('qrcode');

const startConnectionController = async (req, res) => {
    const { connectionId } = req.body;
    if (!connectionId) {
        return res.status(400).json({ status: 'error', message: '`connectionId` is required.' });
    }
    try {
        whatsappService.startConnection(connectionId);
        res.status(200).json({ status: 'success', message: `Connection ${connectionId} started.` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to start connection.', details: error.message });
    }
};

const disconnectConnectionController = async (req, res) => {
    const { connectionId } = req.body;
    if (!connectionId) {
        return res.status(400).json({ status: 'error', message: '`connectionId` is required.' });
    }
    try {
        whatsappService.disconnectConnection(connectionId);
        res.status(200).json({ status: 'success', message: `Connection ${connectionId} disconnected.` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to disconnect connection.', details: error.message });
    }
};

const disconnectAllConnectionsController = async (req, res) => {
    try {
        whatsappService.disconnectAllConnections();
        res.status(200).json({ status: 'success', message: 'All connections disconnected.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to disconnect all connections.', details: error.message });
    }
};

const sendMessageController = async (req, res) => {
    const { connectionId } = req.params;
    const { number, message, file } = req.body;
    if (!number || (!message && !file)) {
        return res.status(400).json({ status: 'error', message: '`number` and (`message` or `file`) are required.' });
    }
    try {
        await whatsappService.sendMessage(connectionId, number, message, file);
        res.status(200).json({ status: 'success', message: `Message sent to ${number} via ${connectionId}` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to send message.', details: error.message });
    }
};

const sendBroadcastMessageController = async (req, res) => {
    const { connectionId } = req.params;
    const { numbers, message, file } = req.body;
    if (!numbers || numbers.length === 0 || (!message && !file)) {
        return res.status(400).json({ status: 'error', message: '`numbers` and (`message` or `file`) are required.' });
    }
    try {
        await whatsappService.sendBroadcastMessage(connectionId, numbers, message, file);
        res.status(200).json({ status: 'success', message: `Broadcast message sent via ${connectionId}` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to send broadcast message.', details: error.message });
    }
};

const getStatusController = (req, res) => {
    const { connectionId } = req.params;
    res.status(200).json(whatsappService.getStatus(connectionId));
};

const getMessagesController = (req, res) => {
    const { connectionId } = req.params;
    res.status(200).json(whatsappService.getMessages(connectionId));
};

const getOutgoingMessagesController = (req, res) => {
    const { connectionId } = req.params;
    res.status(200).json(whatsappService.getOutgoingMessages(connectionId));
};

const getQRCodeController = async (req, res) => {
    const { connectionId } = req.params;
    const { qr } = whatsappService.getQRCode(connectionId);
    if (qr) {
        try {
            const qrUrl = await qrcode.toDataURL(qr);
            res.status(200).json({ qrUrl });
        } catch (err) {
            res.status(500).json({ status: 'error', message: 'Failed to generate QR code.' });
        }
    } else {
        res.status(404).json({ status: 'error', message: 'QR code not available.' });
    }
};

const getAllConnectionsController = (req, res) => {
    res.status(200).json(whatsappService.getAllConnections());
};

const getWebhookController = async (req, res) => {
    try {
        const url = await configService.getWebhookUrl();
        const secret = await configService.getWebhookSecret();
        res.status(200).json({ webhookUrl: url, webhookSecret: secret });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to get webhook URL.' });
    }
};

const updateWebhookController = async (req, res) => {
    const { url, secret } = req.body;
    if (typeof url !== 'string') {
        return res.status(400).json({ status: 'error', message: '`url` (string) is required.' });
    }
    try {
        await configService.setWebhookUrl(url);
        if (typeof secret === 'string') {
            await configService.setWebhookSecret(secret);
        }
        res.status(200).json({ status: 'success', message: 'Webhook settings updated successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update webhook settings.' });
    }
};

module.exports = {
    startConnectionController,
    disconnectConnectionController,
    disconnectAllConnectionsController,
    sendMessageController,
    sendBroadcastMessageController,
    getStatusController,
    getMessagesController,
    getOutgoingMessagesController,
    getQRCodeController,
    getAllConnectionsController,
    getWebhookController,
    updateWebhookController,
};

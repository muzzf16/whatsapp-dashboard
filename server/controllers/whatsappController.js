const whatsappService = require('../services/whatsappService');
const configService = require('../services/configService'); // BARU: Import config service
const qrcode = require('qrcode');

const sendMessageController = async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ status: 'error', message: '`number` and `message` are required.' });
    }

    try {
        await whatsappService.sendMessage(number, message);
        res.status(200).json({ status: 'success', message: `Message sent to ${number}` });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to send message.', 
            details: error.message 
        });
    }
};

const sendMediaMessageController = async (req, res) => {
    const { sessionId, number, message, mediaUrl, mediaType } = req.body;

    if (!sessionId) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'sessionId is required and cannot be empty' 
        });
    }
    
    if (!number || (!mediaUrl && !req.file) || !mediaType) {
        return res.status(400).json({ status: 'error', message: 'Number, mediaType, and either mediaUrl or a file are required.' });
    }

    try {
        if (req.file) {
            const mediaBuffer = await fs.readFile(req.file.path);
            await whatsappService.sendMediaMessage(sessionId, number, message, null, mediaType, mediaBuffer);
            await fs.unlink(req.file.path);
        } else {
            await whatsappService.sendMediaMessage(sessionId, number, message, mediaUrl, mediaType);
        }
        res.status(200).json({ status: 'success', message: `Media message sent to ${number}` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to send media message.', details: error.message });
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
    res.status(200).json(whatsappService.getStatus());
};

const getMessagesController = (req, res) => {
    res.status(200).json(whatsappService.getMessages());
};

const getQRCodeController = async (req, res) => {
    const { qr } = whatsappService.getQRCode();
    if (qr) {
        const qrUrl = await qrcode.toDataURL(qr);
        res.status(200).json({ qrUrl });
    } else {
        res.status(404).json({ status: 'error', message: 'QR code not available.' });
    }
};

// BARU: Controller untuk mendapatkan URL webhook
const getWebhookController = async (req, res) => {
    try {
        const url = await configService.getWebhookUrl();
        res.status(200).json({ webhookUrl: url });
    } catch (error) {
        logger.error('Failed to get webhook config', { error: error.message });
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to get webhook config.' 
        });
    }
};

const updateWebhookController = async (req, res) => {
    const { url } = req.body;
    if (typeof url !== 'string') {
        return res.status(400).json({ status: 'error', message: '`url` (string) is required.' });
    }
    try {
        await configService.setWebhookUrl(url);
        res.status(200).json({ status: 'success', message: 'Webhook URL updated successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to update webhook URL.' });
    }
};

module.exports = {
    sendMessageController,
    getStatusController,
    getQRCodeController,
    getMessagesController,
    getQRCodeController,
    getWebhookController,    // BARU
    updateWebhookController, // BARU
};


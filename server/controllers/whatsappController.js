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
        res.status(500).json({ status: 'error', message: 'Failed to send message.', details: error.message });
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

// BARU: Controller untuk mendapatkan URL webhook
const getWebhookController = async (req, res) => {
    try {
        const url = await configService.getWebhookUrl();
        res.status(200).json({ webhookUrl: url });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to get webhook URL.' });
    }
};

// BARU: Controller untuk memperbarui URL webhook
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
    getMessagesController,
    getQRCodeController,
    getWebhookController,    // BARU
    updateWebhookController, // BARU
};


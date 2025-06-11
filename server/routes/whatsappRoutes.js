const express = require('express');
const {
    sendMessageController,
    getStatusController,
    getMessagesController,
    getQRCodeController,
    getWebhookController,    // BARU
    updateWebhookController, // BARU
} = require('../controllers/whatsappController');

const router = express.Router();

router.post('/send-message', sendMessageController);
router.get('/status', getStatusController);
router.get('/messages', getMessagesController);
router.get('/qrcode', getQRCodeController);

// BARU: Route untuk mengelola webhook
router.get('/webhook', getWebhookController);
router.post('/webhook', updateWebhookController);

module.exports = router;

const express = require('express');
const {
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
} = require('../controllers/whatsappController');

const router = express.Router();

router.post('/connections/start', startConnectionController);
router.post('/connections/disconnect', disconnectConnectionController);
router.post('/connections/disconnect-all', disconnectAllConnectionsController);
router.get('/connections', getAllConnectionsController);

router.post('/:connectionId/send-message', sendMessageController);
router.post('/:connectionId/broadcast-message', sendBroadcastMessageController);
router.get('/:connectionId/status', getStatusController);
router.get('/:connectionId/messages', getMessagesController);
router.get('/:connectionId/outgoing-messages', getOutgoingMessagesController);
router.get('/:connectionId/qrcode', getQRCodeController);

router.get('/webhook', getWebhookController);
router.post('/webhook', updateWebhookController);

module.exports = router;

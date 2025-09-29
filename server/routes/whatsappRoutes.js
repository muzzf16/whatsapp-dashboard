const express = require('express');
const multer = require('multer');
const {
    sendMessageController,
    getStatusController,
    getQRCodeController,
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

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Update the webhook configuration
 *     tags: [Webhook]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: Webhook URL to receive incoming messages
 *               timeout:
 *                 type: number
 *                 description: Timeout for webhook requests in milliseconds (1000-60000)
 *                 example: 10000
 *               retries:
 *                 type: number
 *                 description: Number of retry attempts for failed webhook requests (0-10)
 *                 example: 3
 *               secret:
 *                 type: string
 *                 description: Secret for signing webhook requests (optional, can be null to remove)
 *     responses:
 *       200:
 *         description: Webhook configuration updated successfully
 *       400:
 *         description: Invalid configuration provided
 *       500:
 *         description: Failed to update webhook config
 */
router.post('/webhook', updateWebhookController);

/**
 * @swagger
 * tags:
 *   name: Server
 *   description: API for managing the server
 */

/**
 * @swagger
 * /api/toggle-server:
 *   post:
 *     summary: Toggle the server connection
 *     tags: [Server]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [connect, disconnect]
 *     responses:
 *       200:
 *         description: Server toggled successfully
 *       500:
 *         description: Failed to toggle server
 */


module.exports = router;
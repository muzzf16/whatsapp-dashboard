const express = require('express');
const multer = require('multer');
const {
    startSessionController,
    disconnectSessionController,
    sendMessageController,
    sendMediaMessageController,
    getStatusController,
    getQRCodeController,
    getMessagesController,
    addContactController,
    getContactsController,
    searchContactsController,
    deleteContactController,
    uploadContactsController,
    getWebhookController,
    updateWebhookController,
    sendBroadcastFromFileController,
    toggleServerController
} = require('../controllers/whatsappController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || 
            file.mimetype === 'application/vnd.ms-excel' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype.startsWith('image') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'));
        }
    }
});

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: API for managing sessions
 */

/**
 * @swagger
 * /api/sessions/start:
 *   post:
 *     summary: Start a new session
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session started successfully
 *       400:
 *         description: sessionId is required
 */
router.post('/sessions/start', startSessionController);

/**
 * @swagger
 * /api/sessions/disconnect:
 *   post:
 *     summary: Disconnect a session
 *     tags: [Sessions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session disconnected successfully
 *       400:
 *         description: sessionId is required
 */
router.post('/sessions/disconnect', disconnectSessionController);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: API for sending messages
 */

/**
 * @swagger
 * /api/send-message:
 *   post:
 *     summary: Send a text message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               number: 
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       500:
 *         description: Failed to send message
 */
router.post('/send-message', sendMessageController);

/**
 * @swagger
 * /api/send-media:
 *   post:
 *     summary: Send a media message
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               number:
 *                 type: string
 *               message:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *               mediaType:
 *                 type: string
 *                 enum: [image, document]
 *     responses:
 *       200:
 *         description: Media message sent successfully
 *       500:
 *         description: Failed to send media message
 */
router.post('/send-media', upload.single('media'), sendMediaMessageController);

/**
 * @swagger
 * tags:
 *   name: Status
 *   description: API for getting status
 */

/**
 * @swagger
 * /api/{sessionId}/status:
 *   get:
 *     summary: Get the connection status of a session
 *     tags: [Status]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *     responses:
 *       200:
 *         description: The connection status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *       500:
 *         description: Failed to get status
 */
router.get('/:sessionId/status', getStatusController);

/**
 * @swagger
 * /api/{sessionId}/qrcode:
 *   get:
 *     summary: Get the QR code for a session
 *     tags: [Status]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *     responses:
 *       200:
 *         description: The QR code data URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrUrl:
 *                   type: string
 *       404:
 *         description: QR code not available
 *       500:
 *         description: Failed to generate QR code
 */
router.get('/:sessionId/qrcode', getQRCodeController);

/**
 * @swagger
 * /api/{sessionId}/messages:
 *   get:
 *     summary: Get the last 100 messages for a session
 *     tags: [Status]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The session ID
 *     responses:
 *       200:
 *         description: A list of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to get messages
 */
router.get('/:sessionId/messages', getMessagesController);

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: API for managing contacts
 */

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Add a new contact
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact added successfully
 *       500:
 *         description: Failed to add contact
 */
router.post('/contacts', addContactController);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Get all contacts
 *     tags: [Contacts]
 *     responses:
 *       200:
 *         description: A list of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to get contacts
 */
router.get('/contacts', getContactsController);

/**
 * @swagger
 * /api/contacts/search:
 *   get:
 *     summary: Search for contacts
 *     tags: [Contacts]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: The search query
 *     responses:
 *       200:
 *         description: A list of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contacts:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Failed to search contacts
 */
router.get('/contacts/search', searchContactsController);

/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: Delete a contact
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The contact ID
 *     responses:
 *       200:
 *         description: Contact deleted successfully
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Failed to delete contact
 */
router.delete('/contacts/:id', deleteContactController);

/**
 * @swagger
 * /api/contacts/upload:
 *   post:
 *     summary: Upload contacts from a file
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Contacts uploaded successfully
 *       500:
 *         description: Failed to upload contacts
 */
router.post('/contacts/upload', upload.single('file'), uploadContactsController);

/**
 * @swagger
 * /api/broadcast-from-file:
 *   post:
 *     summary: Send a broadcast message from a file
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               message:
 *                 type: string
 *               delay:
 *                 type: integer
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Broadcast started successfully
 *       500:
 *         description: Failed to start broadcast
 */
router.post('/broadcast-from-file', upload.single('file'), sendBroadcastFromFileController);

/**
 * @swagger
 * tags:
 *   name: Webhook
 *   description: API for managing webhooks
 */

/**
 * @swagger
 * /api/webhook:
 *   get:
 *     summary: Get the current webhook URL
 *     tags: [Webhook]
 *     responses:
 *       200:
 *         description: The webhook URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 webhookUrl:
 *                   type: string
 *       500:
 *         description: Failed to get webhook URL
 */
router.get('/webhook', getWebhookController);

/**
 * @swagger
 * /api/webhook:
 *   post:
 *     summary: Update the webhook URL
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
 *     responses:
 *       200:
 *         description: Webhook URL updated successfully
 *       500:
 *         description: Failed to update webhook URL
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
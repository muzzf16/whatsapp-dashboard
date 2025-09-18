const express = require('express');
const multer = require('multer');
const {
    sendMessageController,
    sendReplyMessageController,
    sendBroadcastMessageController,
    sendMediaMessageController,
    getStatusController,
    refreshStatusController,
    getMessagesController,
    getQRCodeController,
    getWebhookController,
    updateWebhookController,
    // Contact management controllers
    addContactController,
    getContactsController,
    searchContactsController,
    deleteContactController,
    uploadContactsController,
    // Toggle server controller
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
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    }
});

router.post('/send-message', sendMessageController);
router.post('/send-reply', sendReplyMessageController);
router.post('/send-broadcast', sendBroadcastMessageController);
router.post('/send-media', sendMediaMessageController);
router.get('/status', getStatusController);
router.post('/refresh-status', refreshStatusController);
router.get('/messages', getMessagesController);
router.get('/qrcode', getQRCodeController);

// Contact management routes
router.post('/contacts', addContactController);
router.get('/contacts', getContactsController);
router.get('/contacts/search', searchContactsController);
router.delete('/contacts/:id', deleteContactController);
router.post('/contacts/upload', upload.single('file'), uploadContactsController);

router.get('/webhook', getWebhookController);
router.post('/webhook', updateWebhookController);

// Toggle server connection
router.post('/toggle-server', toggleServerController);

module.exports = router;

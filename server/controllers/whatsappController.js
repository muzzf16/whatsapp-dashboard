const whatsappService = require('../services/whatsappService');
const configService = require('../services/configService');
const { addContact, addContacts, getAllContacts, searchContacts, deleteContact } = require('../utils/database');
const { parseCSV, parseExcel, extractPhoneNumbers } = require('../utils/fileParser');
const qrcode = require('qrcode');
const { validateWebhookUrl, validateMessageData, validateBroadcastData } = require('../utils/validation');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const startSessionController = (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ status: 'error', message: 'sessionId is required' });
    }
    whatsappService.startNewSession(sessionId, req.app.get('io'));
    res.status(200).json({ status: 'success', message: `Session ${sessionId} started` });
};

const sendMessageController = async (req, res) => {
    const { sessionId, number, message } = req.body;
    const validation = validateMessageData(number, message);
    if (!validation.isValid) {
        return res.status(400).json({ status: 'error', message: validation.error });
    }

    try {
        await whatsappService.sendMessage(sessionId, number, message);
        res.status(200).json({ status: 'success', message: `Message sent to ${number}` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to send message.', details: error.message });
    }
};

const sendMediaMessageController = async (req, res) => {
    const { sessionId, number, message, mediaUrl, mediaType } = req.body;

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

const getStatusController = (req, res) => {
    const { sessionId } = req.params;
    const status = whatsappService.getStatus(sessionId);
    res.status(200).json(status);
};

const getQRCodeController = async (req, res) => {
    const { sessionId } = req.params;
    const { qr } = whatsappService.getQRCode(sessionId);
    if (qr) {
        const qrUrl = await qrcode.toDataURL(qr);
        res.status(200).json({ qrUrl });
    } else {
        res.status(404).json({ status: 'error', message: 'QR code not available.' });
    }
};

const getMessagesController = (req, res) => {
    const { sessionId } = req.params;
    const messages = whatsappService.getMessages(sessionId);
    res.status(200).json(messages);
};

const disconnectSessionController = (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ status: 'error', message: 'sessionId is required' });
    }
    whatsappService.disconnectWhatsApp(sessionId);
    res.status(200).json({ status: 'success', message: `Session ${sessionId} disconnected` });
};

const addContactController = async (req, res) => {
    const { name, phone } = req.body;
    
    if (!phone) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Phone number is required.' 
        });
    }
    
    try {
        const contactId = await addContact(name || '', phone);
        logger.info('Contact added successfully', { contactId, name, phone });
        
        res.status(200).json({ 
            status: 'success', 
            message: 'Contact added successfully.',
            contactId
        });
    } catch (error) {
        logger.error('Failed to add contact', { error: error.message, name, phone });
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to add contact.',
            details: error.message
        });
    }
};

const getContactsController = async (req, res) => {
    try {
        const contacts = await getAllContacts();
        logger.info('Contacts retrieved', { count: contacts.length });
        
        res.status(200).json({ 
            status: 'success', 
            contacts
        });
    } catch (error) {
        logger.error('Failed to get contacts', { error: error.message });
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to get contacts.',
            details: error.message
        });
    }
};

const searchContactsController = async (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Search query is required.' 
        });
    }
    
    try {
        const contacts = await searchContacts(q);
        logger.info('Contacts searched', { query: q, count: contacts.length });
        
        res.status(200).json({ 
            status: 'success', 
            contacts
        });
    } catch (error) {
        logger.error('Failed to search contacts', { error: error.message, query: q });
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to search contacts.',
            details: error.message
        });
    }
};

const deleteContactController = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Contact ID is required.' 
        });
    }
    
    try {
        const changes = await deleteContact(id);
        logger.info('Contact deleted', { id, changes });
        
        if (changes === 0) {
            return res.status(404).json({ 
                status: 'error', 
                message: 'Contact not found.' 
            });
        }
        
        res.status(200).json({ 
            status: 'success', 
            message: 'Contact deleted successfully.'
        });
    } catch (error) {
        logger.error('Failed to delete contact', { error: error.message, id });
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to delete contact.',
            details: error.message
        });
    }
};

const uploadContactsController = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'File is required.' 
        });
    }
    
    try {
        const filePath = req.file.path;
        let data;
        
        // Parse file based on type
        if (req.file.mimetype === 'text/csv') {
            data = await parseCSV(filePath);
        } else {
            data = await parseExcel(filePath);
        }
        
        // Extract phone numbers
        const contacts = extractPhoneNumbers(data);
        
        if (contacts.length === 0) {
            await fs.unlink(filePath); // Clean up file
            return res.status(400).json({ 
                status: 'error', 
                message: 'No valid phone numbers found in the file.' 
            });
        }
        
        // Add contacts to database
        const insertedCount = await addContacts(contacts);
        
        // Clean up uploaded file
        await fs.unlink(filePath);
        
        logger.info('Contacts uploaded successfully', { insertedCount, totalParsed: contacts.length });
        
        res.status(200).json({ 
            status: 'success', 
            message: `${insertedCount} contacts added successfully.`,
            insertedCount,
            totalParsed: contacts.length
        });
    } catch (error) {
        logger.error('Failed to upload contacts', { error: error.message });
        
        // Clean up uploaded file if it exists
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                logger.error('Failed to clean up uploaded file', { error: unlinkError.message });
            }
        }
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to upload contacts.',
            details: error.message
        });
    }
};

const getWebhookController = async (req, res) => {
    try {
        const url = await configService.getWebhookUrl();
        logger.info('Webhook URL requested');
        res.status(200).json({ webhookUrl: url });
    } catch (error) {
        logger.error('Failed to get webhook URL', { error: error.message });
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to get webhook URL.' 
        });
    }
};

const updateWebhookController = async (req, res) => {
    const { url } = req.body;
    
    // Validate input
    const validation = validateWebhookUrl(url);
    if (!validation.isValid) {
        logger.warn('Invalid webhook URL received', { url });
        return res.status(400).json({ 
            status: 'error', 
            message: validation.error 
        });
    }
    
    try {
        logger.info('Updating webhook URL', { url });
        await configService.setWebhookUrl(url);
        logger.info('Webhook URL updated successfully');
        
        res.status(200).json({ 
            status: 'success', 
            message: 'Webhook URL updated successfully.' 
        });
    } catch (error) {
        logger.error('Failed to update webhook URL', { 
            error: error.message, 
            url
        });
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to update webhook URL.' 
        });
    }
};


module.exports = {
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
    updateWebhookController
};
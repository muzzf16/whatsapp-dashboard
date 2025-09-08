const whatsappService = require('../services/whatsappService');
const configService = require('../services/configService');
const { addContact, addContacts, getAllContacts, searchContacts, deleteContact } = require('../utils/database');
const { parseCSV, parseExcel, extractPhoneNumbers } = require('../utils/fileParser');
const qrcode = require('qrcode');
const { validateWebhookUrl, validateMessageData, validateBroadcastData } = require('../utils/validation');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const sendMessageController = async (req, res) => {
    const { number, message } = req.body;
    
    // Validate input
    const validation = validateMessageData(number, message);
    if (!validation.isValid) {
        logger.warn('Invalid message data received', { number, message });
        return res.status(400).json({ 
            status: 'error', 
            message: validation.error 
        });
    }
    
    try {
        logger.info('Sending message', { number, message });
        await whatsappService.sendMessage(number, message);
        logger.info('Message sent successfully', { number });
        
        res.status(200).json({ 
            status: 'success', 
            message: `Message sent to ${number}` 
        });
    } catch (error) {
        logger.error('Failed to send message', { 
            error: error.message, 
            number,
            message
        });
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to send message.', 
            details: error.message 
        });
    }
};

const sendBroadcastMessageController = async (req, res) => {
    const { numbers, message, delay = 1 } = req.body;
    
    // Validate input
    const validation = validateBroadcastData(numbers, message);
    if (!validation.isValid) {
        logger.warn('Invalid broadcast data received', { numbers, message });
        return res.status(400).json({ 
            status: 'error', 
            message: validation.error 
        });
    }
    
    try {
        logger.info('Sending broadcast message', { count: numbers.length, message, delay });
        
        const results = [];
        for (let i = 0; i < numbers.length; i++) {
            try {
                await whatsappService.sendMessage(numbers[i], message);
                results.push({ number: numbers[i], status: 'success' });
                logger.info('Broadcast message sent successfully', { number: numbers[i] });
            } catch (error) {
                logger.error('Failed to send broadcast message', { 
                    error: error.message, 
                    number: numbers[i],
                    message
                });
                results.push({ number: numbers[i], status: 'error', error: error.message });
            }
            
            // Add delay between messages to avoid rate limiting
            if (i < numbers.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
        }
        
        const successCount = results.filter(r => r.status === 'success').length;
        const failCount = results.filter(r => r.status === 'error').length;
        
        logger.info('Broadcast completed', { successCount, failCount });
        
        res.status(200).json({ 
            status: 'success', 
            message: `Broadcast completed: ${successCount} successful, ${failCount} failed`,
            results
        });
    } catch (error) {
        logger.error('Failed to send broadcast message', { 
            error: error.message,
            numbers,
            message
        });
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to send broadcast message.', 
            details: error.message 
        });
    }
};

const sendMediaMessageController = async (req, res) => {
    const { number, message, mediaUrl, mediaType } = req.body;
    
    if (!number || !mediaUrl || !mediaType) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Number, mediaUrl, and mediaType are required.' 
        });
    }
    
    try {
        logger.info('Sending media message', { number, mediaType });
        await whatsappService.sendMediaMessage(number, message, mediaUrl, mediaType);
        logger.info('Media message sent successfully', { number });
        
        res.status(200).json({ 
            status: 'success', 
            message: `Media message sent to ${number}` 
        });
    } catch (error) {
        logger.error('Failed to send media message', { 
            error: error.message, 
            number,
            mediaType
        });
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to send media message.', 
            details: error.message 
        });
    }
};

const getStatusController = (req, res) => {
    try {
        const status = whatsappService.getStatus();
        logger.info('Status requested', { status });
        res.status(200).json(status);
    } catch (error) {
        logger.error('Error getting status', { error: error.message });
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to get status.' 
        });
    }
};

const refreshStatusController = async (req, res) => {
    try {
        const status = await whatsappService.refreshConnectionStatus();
        logger.info('Status refreshed', { status });
        res.status(200).json(status);
    } catch (error) {
        logger.error('Error refreshing status', { error: error.message });
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to refresh status.' 
        });
    }
};

const getMessagesController = (req, res) => {
    try {
        const messages = whatsappService.getMessages();
        logger.info('Messages requested', { count: messages.messages.length });
        res.status(200).json(messages);
    } catch (error) {
        logger.error('Error getting messages', { error: error.message });
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to get messages.' 
        });
    }
};

const getQRCodeController = async (req, res) => {
    try {
        const { qr } = whatsappService.getQRCode();
        if (qr) {
            const qrUrl = await qrcode.toDataURL(qr);
            logger.info('QR code requested and generated');
            res.status(200).json({ qrUrl });
        } else {
            logger.warn('QR code requested but not available');
            res.status(404).json({ 
                status: 'error', 
                message: 'QR code not available.' 
            });
        }
    } catch (err) {
        logger.error('Failed to generate QR code', { error: err.message });
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to generate QR code.' 
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

// Contact management controllers
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

// Toggle server connection
const toggleServerController = async (req, res) => {
    const { action } = req.body;
    
    if (!action || (action !== 'connect' && action !== 'disconnect')) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Action must be either "connect" or "disconnect".' 
        });
    }
    
    try {
        let result;
        if (action === 'disconnect') {
            logger.info('Disconnecting WhatsApp server');
            result = await whatsappService.disconnectWhatsApp();
        } else {
            logger.info('Reconnecting WhatsApp server');
            result = await whatsappService.reconnectWhatsApp();
        }
        
        res.status(200).json(result);
    } catch (error) {
        logger.error('Failed to toggle server', { error: error.message, action });
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to toggle server.',
            details: error.message
        });
    }
};

module.exports = {
    sendMessageController,
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
};


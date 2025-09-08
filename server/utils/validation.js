const logger = require('./logger');

const validateWebhookUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return { isValid: false, error: 'URL must be a non-empty string' };
    }
    
    try {
        new URL(url);
        return { isValid: true };
    } catch (error) {
        logger.error('Invalid URL format:', error.message);
        return { isValid: false, error: 'Invalid URL format' };
    }
};

const validateMessageData = (number, message) => {
    if (!number || typeof number !== 'string') {
        return { isValid: false, error: 'Number must be a non-empty string' };
    }
    
    if (!message || typeof message !== 'string') {
        return { isValid: false, error: 'Message must be a non-empty string' };
    }
    
    return { isValid: true };
};

const validateBroadcastData = (numbers, message) => {
    if (!Array.isArray(numbers)) {
        return { isValid: false, error: 'Numbers must be an array' };
    }
    
    if (numbers.length === 0) {
        return { isValid: false, error: 'At least one number is required' };
    }
    
    if (numbers.length > 100) {
        return { isValid: false, error: 'Maximum 100 numbers allowed in a single broadcast' };
    }
    
    for (const number of numbers) {
        if (typeof number !== 'string' || !number.trim()) {
            return { isValid: false, error: 'All numbers must be non-empty strings' };
        }
    }
    
    if (!message || typeof message !== 'string') {
        return { isValid: false, error: 'Message must be a non-empty string' };
    }
    
    return { isValid: true };
};

module.exports = {
    validateWebhookUrl,
    validateMessageData,
    validateBroadcastData
};
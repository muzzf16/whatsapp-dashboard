const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const logger = require('./logger');

// Parse CSV file
const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                logger.info('CSV file parsed successfully', { rowCount: results.length });
                resolve(results);
            })
            .on('error', (error) => {
                logger.error('Error parsing CSV file', error);
                reject(error);
            });
    });
};

// Parse Excel file
const parseExcel = (filePath) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);
            
            logger.info('Excel file parsed successfully', { rowCount: data.length });
            resolve(data);
        } catch (error) {
            logger.error('Error parsing Excel file', error);
            reject(error);
        }
    });
};

// Extract phone numbers from parsed data
const extractPhoneNumbers = (data) => {
    const contacts = [];
    
    data.forEach(row => {
        // Look for phone number columns (common names)
        const phoneKeys = Object.keys(row).filter(key => 
            key.toLowerCase().includes('phone') || 
            key.toLowerCase().includes('tel') || 
            key.toLowerCase().includes('nomor') ||
            key.toLowerCase().includes('wa') ||
            key.toLowerCase().includes('hp')
        );
        
        // Also look for name columns
        const nameKeys = Object.keys(row).filter(key => 
            key.toLowerCase().includes('name') || 
            key.toLowerCase().includes('nama')
        );
        
        if (phoneKeys.length > 0) {
            const phone = row[phoneKeys[0]];
            const name = nameKeys.length > 0 ? row[nameKeys[0]] : '';
            
            // Clean phone number (remove spaces, dashes, etc.)
            const cleanPhone = phone.toString().replace(/[^0-9+]/g, '');
            
            if (cleanPhone) {
                contacts.push({
                    name: name || '',
                    phone: cleanPhone
                });
            }
        }
    });
    
    logger.info('Phone numbers extracted', { count: contacts.length });
    return contacts;
};

module.exports = {
    parseCSV,
    parseExcel,
    extractPhoneNumbers
};
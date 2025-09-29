const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./logger');

// Create or open the database
const dbPath = path.join(__dirname, '..', 'contacts.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Error opening database', err);
    } else {
        logger.info('Connected to SQLite database');
        // Create contacts table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                logger.error('Error creating contacts table', err);
            } else {
                logger.info('Contacts table ready');
            }
        });
    }
});

// Add a contact
const addContact = (name, phone) => {
    return new Promise((resolve, reject) => {
        db.run('INSERT OR IGNORE INTO contacts (name, phone) VALUES (?, ?)', [name, phone], function(err) {
            if (err) {
                logger.error('Error adding contact', err);
                reject(err);
            } else {
                logger.info('Contact added/updated', { name, phone });
                resolve(this.lastID);
            }
        });
    });
};

// Add multiple contacts
const addContacts = (contacts) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT OR IGNORE INTO contacts (name, phone) VALUES (?, ?)');
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            let insertedCount = 0;
            
            contacts.forEach(contact => {
                stmt.run(contact.name || '', contact.phone, function(err) {
                    if (err) {
                        logger.error('Error adding contact', err);
                    } else {
                        insertedCount++;
                    }
                });
            });
            
            stmt.finalize();
            db.run('COMMIT', (err) => {
                if (err) {
                    logger.error('Error committing transaction', err);
                    reject(err);
                } else {
                    logger.info('Contacts added', { count: insertedCount });
                    resolve(insertedCount);
                }
            });
        });
    });
};

// Get all contacts
const getAllContacts = () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM contacts ORDER BY name, phone', (err, rows) => {
            if (err) {
                logger.error('Error getting contacts', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Search contacts
const searchContacts = (query) => {
    return new Promise((resolve, reject) => {
        const searchQuery = `%${query}%`;
        db.all('SELECT * FROM contacts WHERE name LIKE ? OR phone LIKE ? ORDER BY name, phone', 
            [searchQuery, searchQuery], (err, rows) => {
            if (err) {
                logger.error('Error searching contacts', err);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Delete a contact
const deleteContact = (id) => {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM contacts WHERE id = ?', [id], function(err) {
            if (err) {
                logger.error('Error deleting contact', err);
                reject(err);
            } else {
                logger.info('Contact deleted', { id });
                resolve(this.changes);
            }
        });
    });
};

// Close the database
const closeDatabase = () => {
    db.close((err) => {
        if (err) {
            logger.error('Error closing database', err);
        } else {
            logger.info('Database connection closed');
        }
    });
};

module.exports = {
    addContact,
    addContacts,
    getAllContacts,
    searchContacts,
    deleteContact,
    closeDatabase
};
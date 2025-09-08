const fs = require('fs/promises');
const path = require('path');
const logger = require('../utils/logger');

const configPath = path.join(__dirname, '..', 'config.json');

async function readConfig() {
    try {
        const data = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(data);
        logger.info('Config file read successfully');
        return config;
    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.info('Config file not found, creating default config');
            await writeConfig({ webhookUrl: "" });
            return { webhookUrl: "" };
        }
        logger.error("Error reading config file:", error);
        throw error;
    }
}

async function writeConfig(config) {
    try {
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
        logger.info('Config file written successfully');
    } catch (error) {
        logger.error("Error writing to config file:", error);
        throw error;
    }
}

const getWebhookUrl = async () => {
    try {
        const config = await readConfig();
        return config.webhookUrl || "";
    } catch (error) {
        logger.error("Error getting webhook URL:", error);
        return "";
    }
};

const setWebhookUrl = async (url) => {
    try {
        const config = await readConfig();
        config.webhookUrl = url;
        await writeConfig(config);
        logger.info('Webhook URL updated successfully', { url });
    } catch (error) {
        logger.error("Error setting webhook URL:", error);
        throw error;
    }
};

module.exports = {
    getWebhookUrl,
    setWebhookUrl,
};

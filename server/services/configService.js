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
            await writeConfig({ webhookUrl: "" });
            return { webhookUrl: "" };
        }
        console.error("Error reading config file:", error);
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

const getWebhookConfig = async () => {
    try {
        const config = await readConfig();
        return {
            webhookUrl: config.webhookUrl || "",
            webhookTimeout: config.webhookTimeout || 10000,
            webhookRetries: config.webhookRetries || 3,
            webhookSecret: config.webhookSecret || null
        };
    } catch (error) {
        logger.error("Error getting webhook config:", error);
        return {
            webhookUrl: "",
            webhookTimeout: 10000,
            webhookRetries: 3,
            webhookSecret: null
        };
    }
};

const getWebhookUrl = async () => {
    try {
        const config = await getWebhookConfig();
        return config.webhookUrl;
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

// New functions to manage webhook configuration
const setWebhookConfig = async (webhookConfig) => {
    try {
        const config = await readConfig();
        if (webhookConfig.webhookUrl !== undefined) config.webhookUrl = webhookConfig.webhookUrl;
        if (webhookConfig.webhookTimeout !== undefined) config.webhookTimeout = webhookConfig.webhookTimeout;
        if (webhookConfig.webhookRetries !== undefined) config.webhookRetries = webhookConfig.webhookRetries;
        if (webhookConfig.webhookSecret !== undefined) config.webhookSecret = webhookConfig.webhookSecret;
        await writeConfig(config);
        logger.info('Webhook config updated successfully', { webhookConfig });
    } catch (error) {
        logger.error("Error setting webhook config:", error);
        throw error;
    }
};

const getWebhookSecret = async () => {
    const config = await readConfig();
    return config.webhookSecret || "";
};

const setWebhookSecret = async (secret) => {
    const config = await readConfig();
    config.webhookSecret = secret;
    await writeConfig(config);
};

module.exports = {
    getWebhookUrl,
    setWebhookUrl,
};
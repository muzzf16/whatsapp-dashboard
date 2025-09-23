
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

const whatsappRoutes = require('./routes/whatsappRoutes');
const { initWhatsApp } = require('./services/whatsappService');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Menentukan port untuk backend
const PORT = process.env.PORT || 4000;

// Setup Socket.IO dengan konfigurasi CORS
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3003"], // Izinkan koneksi dari frontend React
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors()); // Mengaktifkan CORS untuk semua route
app.use(express.json()); // Mem-parsing body JSON

// Request logging middleware
app.use((req, res, next) => {
    logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip
    });
    next();
});

const specs = require('./utils/swagger');
const swaggerUi = require('swagger-ui-express');

// Menggunakan routes yang telah didefinisikan
app.use('/api', whatsappRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/', (req, res) => {
    res.send('<h1>WhatsApp API Backend</h1><p>Server is running and waiting for client connections.</p>');
});

// Menghubungkan Socket.IO
io.on('connection', (socket) => {
    logger.info('A user connected to WebSocket', { socketId: socket.id });
    socket.on('disconnect', () => {
        logger.info('User disconnected', { socketId: socket.id });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error on URL: %s', req.url);
    logger.error('Request body:', req.body);
    logger.error(err); // Log the full error object
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        details: err.message // Optionally send back the error message
    });
});

// Memulai server
server.listen(PORT, () => {
    logger.info(`Backend server is running on http://localhost:${PORT}`);
    app.set('io', io);
    
    // Inisialisasi WhatsApp Service dan teruskan instance 'io'
    initWhatsApp(io);});

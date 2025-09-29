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

const PORT = process.env.PORT || 4000;

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Izinkan koneksi dari frontend React
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors()); // Mengaktifkan CORS untuk semua route
app.use(express.json()); // Mem-parsing body JSON

// Menggunakan routes yang telah didefinisikan
app.use('/api', whatsappRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/', (req, res) => {
    res.send('<h1>WhatsApp API Backend</h1>');
});

// Socket connection
io.on('connection', (socket) => {
    console.log('A user connected to WebSocket:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Init WhatsApp service dengan passing io
initWhatsApp(io);

server.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    // Inisialisasi WhatsApp Service dan teruskan instance 'io'
    initWhatsApp(io);
});

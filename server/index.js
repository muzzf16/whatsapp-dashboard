
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const whatsappRoutes = require('./routes/whatsappRoutes');
const { initWhatsApp } = require('./services/whatsappService');

const app = express();
const server = http.createServer(app);

// Menentukan port untuk backend
const PORT = process.env.PORT || 4000;

// Setup Socket.IO dengan konfigurasi CORS
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

app.get('/', (req, res) => {
    res.send('<h1>WhatsApp API Backend</h1><p>Server is running and waiting for client connections.</p>');
});

// Menghubungkan Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected to WebSocket:', socket.id);
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Memulai server
server.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    // Inisialisasi WhatsApp Service dan teruskan instance 'io'
    initWhatsApp(io);
});

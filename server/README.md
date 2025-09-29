# WhatsApp API Server

This is the backend for the WhatsApp Dashboard application, built with Node.js and Express.

## Project Structure

```
server/
├── controllers/         # Request handlers
├── routes/              # API route definitions
├── services/            # Business logic
├── utils/               # Utility functions
│   ├── logger.js        # Logging utility
│   └── validation.js    # Input validation
├── auth_info_baileys/   # WhatsApp authentication data
├── config.json          # Application configuration
├── index.js             # Entry point
└── package.json         # Dependencies
```

## API Endpoints

### Message Endpoints
- `POST /api/send-message` - Send a message
  - Body: `{ number: string, message: string }`

### Status Endpoints
- `GET /api/status` - Get connection status
- `GET /api/qrcode` - Get QR code for authentication
- `GET /api/messages` - Get recent incoming messages

### Webhook Endpoints
- `GET /api/webhook` - Get current webhook URL
- `POST /api/webhook` - Update webhook URL
  - Body: `{ url: string }`

## Services

### WhatsApp Service
Handles the connection to WhatsApp using the Baileys library. Manages:
- Connection status
- QR code generation
- Message sending
- Incoming message handling
- Webhook notifications

### Config Service
Manages application configuration stored in `config.json`:
- Webhook URL storage and retrieval

## Utilities

### Logger
Provides structured logging using Pino with pretty printing for development.

### Validation
Provides input validation for:
- Webhook URLs
- Message data (number and message content)

## Socket.IO Events

The server emits the following events to connected clients:

- `status` - Connection status updates
- `qr_code` - QR code data
- `new_message` - New incoming messages

## Environment Variables

- `PORT` - Server port (default: 4000)
- `LOG_LEVEL` - Logging level (default: info)
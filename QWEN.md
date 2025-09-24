# WhatsApp Dashboard - Project Context

## Project Overview

WhatsApp Dashboard is a full-stack web application for managing WhatsApp through a dashboard interface. The application is built with a React frontend and a Node.js/Express backend, utilizing the Baileys library to interface with WhatsApp's Web API.

### Architecture
- **Frontend**: React application with Tailwind CSS, Socket.IO Client for real-time communication
- **Backend**: Node.js/Express server with Socket.IO, Baileys (WhatsApp API), Pino for logging
- **Database**: SQLite for storing contacts
- **File Storage**: Local file system for uploaded contacts and media files

### Key Features
- WhatsApp Integration: Connect to WhatsApp using QR code authentication
- Message Sending: Send messages to contacts through the dashboard
- Media Message Sending: Send images and documents via the dashboard
- Contact Management: Add, search, delete, and manage contacts with import/export functionality
- File-Based Broadcasting: Send bulk messages to contacts from CSV/Excel files
- Message Logging: View incoming messages in real-time
### Webhook Support: Forward incoming messages to a configurable webhook URL with enhanced features

The application supports forwarding incoming messages to a webhook URL configured with:
- Configurable timeout (default: 10 seconds, range: 1-60 seconds)
- Configurable retry attempts (default: 3, range: 0-10)
- Optional webhook request signing for security
- Enhanced payload with timestamp and message type
- Compatibility fields for common webhook consumers (number, message, type)
- Exponential backoff retry mechanism for failed requests
- Real-time Updates: Get real-time status updates through Socket.IO

## Project Structure

```
whatsapp-dashboard/
├── client/              # React frontend
│   ├── src/             # Source code
│   │   └── components/  # Reusable components
│   └── README.md        # Client documentation
├── server/              # Node.js backend
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── README.md        # Server documentation
└── README.md            # Top-level documentation
```

## Building and Running

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. Clone the repository
2. Install dependencies for both client and server:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
3. Start the development servers:
   ```bash
   # In server directory
   npm start
   
   # In client directory (in a separate terminal)
   npm start
   ```

The backend server runs on `http://localhost:4000` by default.
The frontend development server runs on `http://localhost:3000` by default.

### API Documentation
The backend includes Swagger API documentation available at `/api-docs` endpoint.

## Development Conventions

### Backend Architecture
- **Controllers**: Handle HTTP requests and responses with validation
- **Services**: Business logic for WhatsApp integration and session management
- **Utils**: Utility functions for database operations, file parsing, validation, and logging
- **Routes**: API route definitions with middleware and Swagger documentation

### Frontend Architecture
- **Components**: Reusable UI components like QRCodeDisplay, MessageSender, MessageLog, etc.
- **API Integration**: REST API calls and real-time Socket.IO events
- **State Management**: Component-level state for UI interactions

### Session Management
- Each WhatsApp connection is managed as a separate session using unique session IDs
- Authentication data is stored in `auth_info_baileys_{sessionId}` directories
- QR codes are generated for new connections and invalidated once scanned

### File Handling
- Uploaded files (CSV, Excel, images, documents) are temporarily stored in the uploads directory
- File uploads have a 5MB size limit
- Processed files are automatically cleaned up after processing

### Error Handling
- Proper error handling with appropriate HTTP status codes
- Comprehensive logging using Pino logger
- Input validation for all API endpoints

### Database Schema
The SQLite database contains a single `contacts` table:
- `id`: Primary key (auto-incrementing)
- `name`: Contact name (text)
- `phone`: Contact phone number (unique, text)
- `created_at`: Creation timestamp (datetime)

## API Endpoints

### Session Management
- `POST /api/sessions/start` - Start a new WhatsApp session
- `POST /api/sessions/disconnect` - Disconnect a WhatsApp session

### Messaging
- `POST /api/send-message` - Send a text message (requires valid sessionId)
- `POST /api/send-media` - Send a media message (image/document) (requires valid sessionId)
- `POST /api/broadcast-from-file` - Send broadcast messages from a file (requires valid sessionId)

### Status & Data
- `GET /api/:sessionId/status` - Get connection status
- `GET /api/:sessionId/qrcode` - Get QR code data
- `GET /api/:sessionId/messages` - Get recent messages

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Add a contact
- `GET /api/contacts/search` - Search contacts
- `DELETE /api/contacts/:id` - Delete a contact
- `POST /api/contacts/upload` - Upload contacts from file

### Webhook Management
- `GET /api/webhook` - Get current webhook configuration (URL, timeout, retries, secret status)
- `POST /api/webhook` - Update webhook configuration (URL, timeout, retries, secret)

### Real-time Events via Socket.IO
- `status` - Connection status updates
- `qr_code` - QR code data
- `new_message` - New incoming messages

## Environment Variables
- `PORT` - Server port (default: 4000)
- `LOG_LEVEL` - Logging level (default: info)

## Additional Notes
- The application stores webhook URL configuration in `server/config.json`
- Authentication data is stored in the `server` directory in separate directories for each session
- The application supports CSV and Excel (xlsx) file formats for contact imports
- All file uploads and media messages are subject to size and type restrictions
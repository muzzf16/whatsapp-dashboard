# WhatsApp Dashboard Client

This is the frontend for the WhatsApp Dashboard application, built with React.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── QRCodeDisplay.js     # QR code display component
│   ├── MessageSender.js     # Message sending form
│   ├── WebhookManager.js    # Webhook configuration form
│   ├── MessageLog.js        # Incoming messages display
│   ├── StatusBadge.js       # Connection status indicator
│   └── Notification.js      # Notification component
├── App.js               # Main application component
└── index.js             # Entry point
```

## Components

### QRCodeDisplay
Displays the QR code for WhatsApp authentication when the connection status is "waiting for QR scan".

### MessageSender
Form component for sending messages through WhatsApp. It includes validation to ensure messages can only be sent when connected.

### WebhookManager
Form component for configuring the webhook URL where incoming messages will be forwarded.

### MessageLog
Displays a log of incoming messages in a scrollable list with timestamps.

### StatusBadge
Shows the current connection status with color-coded indicators:
- Green: Connected
- Yellow: Connecting
- Red: Disconnected
- Blue: Waiting for QR scan
- Gray: Logged out

### Notification
Displays temporary notifications for success and error messages.

## API Integration

The frontend communicates with the backend API through the following endpoints:

- `GET /api/status` - Get connection status
- `GET /api/qrcode` - Get QR code for authentication
- `GET /api/messages` - Get recent incoming messages
- `POST /api/send-message` - Send a message
- `GET /api/webhook` - Get current webhook URL
- `POST /api/webhook` - Update webhook URL

## Socket.IO Events

The frontend uses Socket.IO to receive real-time updates:

- `status` - Connection status updates
- `qr_code` - QR code data
- `new_message` - New incoming messages
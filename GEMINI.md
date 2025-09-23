# GEMINI.md

## Project Overview

This project, named "Wadash," is a full-stack web application designed to provide a dashboard for managing a WhatsApp account. It allows users to connect their WhatsApp account via a QR code, send individual and broadcast messages, manage contacts, and view incoming messages in real-time. The application also supports webhooks to forward incoming messages to a specified URL.

The project is divided into two main parts:

*   **`client/`**: A React-based frontend that provides the user interface for the dashboard. It uses Tailwind CSS for styling, Axios for HTTP requests to the backend, and Socket.IO for real-time communication.
*   **`server/`**: A Node.js backend powered by Express.js. It uses the `@whiskeysockets/baileys` library to interact with the WhatsApp platform. It exposes a REST API for the frontend to consume and uses Socket.IO to push real-time updates to the client.

## Building and Running

### Client (React App)

The client-side application is a standard React app created with `create-react-app`.

*   **Install Dependencies:**
    ```bash
    cd client
    npm install
    ```

*   **Run Development Server:**
    ```bash
    cd client
    npm start
    ```
    This will start the development server, usually on `http://localhost:3000`.

*   **Build for Production:**
    ```bash
    cd client
    npm run build
    ```

### Server (Node.js App)

The server-side application is a Node.js/Express server.

*   **Install Dependencies:**
    ```bash
    cd server
    npm install
    ```

*   **Run Server:**
    ```bash
    cd server
    npm start
    ```
    This will start the backend server, by default on `http://localhost:4000`.

## Development Conventions

*   **Code Style**: The code seems to follow standard JavaScript and React conventions. The server-side code uses `require` for modules, while the client-side code uses ES6 `import`/`export` statements.
*   **API**: The backend provides a RESTful API under the `/api` prefix.
*   **Real-time Updates**: Real-time communication between the client and server is handled via Socket.IO. The server emits events like `status`, `qr_code`, and `new_message` to keep the client updated.
*   **Configuration**: The server uses a `config.json` file for application-level configuration, such as storing the webhook URL. The client fetches the API URL from `http://localhost:4000`.
*   **Logging**: The server uses the `pino` library for structured logging.

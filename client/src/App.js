import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import QRCodeDisplay from './components/QRCodeDisplay';
import MessageSender from './components/MessageSender';
import BroadcastMessage from './components/BroadcastMessage';
import MediaMessage from './components/MediaMessage';
import WebhookManager from './components/WebhookManager';
import MessageLog from './components/MessageLog';
import StatusBadge from './components/StatusBadge';
import Notification from './components/Notification';
import ContactManager from './components/ContactManager';

import BroadcastFromFile from './components/BroadcastFromFile';

const API_URL = '';

export default function App() {
    const [socket, setSocket] = useState(null);
    const [sessionId, setSessionId] = useState('default');
    const [status, setStatus] = useState('disconnected');
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [messages, setMessages] = useState([]);
    const [file, setFile] = useState(null);
    
    // Single message state
    const [sendTo, setSendTo] = useState('');
    const [sendMessageText, setSendMessageText] = useState('');
    
    // Broadcast message state
    const [recipients, setRecipients] = useState([]);
    const [broadcastMessageText, setBroadcastMessageText] = useState('');
    const [delay, setDelay] = useState(1); // Default 1 second delay
    
    // Media message state
    const [mediaRecipients, setMediaRecipients] = useState([]);
    const [mediaMessageText, setMediaMessageText] = useState('');
    
    // Contact management state
    const [contacts, setContacts] = useState([]);
    const [selectedContacts, setSelectedContacts] = useState([]);
    
    // UI state
    const [isSending, setIsSending] = useState(false);
    const [isSendingMedia, setIsSendingMedia] = useState(false);
    const [isBroadcastMode, setIsBroadcastMode] = useState(false);
    const [isMediaMode, setIsMediaMode] = useState(false);
    const [isContactMode, setIsContactMode] = useState(false);
    const [isSavingWebhook, setIsSavingWebhook] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [broadcastProgress, setBroadcastProgress] = useState({ sent: 0, total: 0 });
    
    const messagesEndRef = useRef(null);

    const showNotification = (message, type) => {
        setNotification({ message, type });
    };

    // Initialize socket connection
    useEffect(() => {
        const newSocket = io(API_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        
        setSocket(newSocket);
        
        newSocket.on('connect', () => {
            showNotification('Connected to server', 'success');
        });
        
        newSocket.on('disconnect', (reason) => {
            showNotification('Disconnected from server', 'error');
        });
        
        newSocket.on('connect_error', (error) => {
            showNotification('Failed to connect to server', 'error');
        });
        
        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('status', (data) => {
            if (data.sessionId === sessionId) {
                setStatus(data.status);
            }
        });
        
        socket.on('qr_code', (data) => {
            if (data.sessionId === sessionId) {
                setQrCodeUrl(data.qrUrl);
            }
        });
        
        socket.on('new_message', (data) => {
            if (data.sessionId === sessionId) {
                setMessages(prevMessages => [data.log, ...prevMessages].slice(0, 100));
            }
        });

        return () => {
            socket.off('status');
            socket.off('qr_code');
            socket.off('new_message');
        };
    }, [socket, sessionId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleStartSession = async () => {
        try {
            await axios.post(`${API_URL}/api/sessions/start`, { sessionId });
            showNotification(`Session ${sessionId} started`, 'success');
            fetchSessionData();
        } catch (error) {
            showNotification('Failed to start session', 'error');
        }
    };

    const handleDisconnectSession = async () => {
        try {
            await axios.post(`${API_URL}/api/sessions/disconnect`, { sessionId });
            showNotification(`Session ${sessionId} disconnected`, 'success');
            setStatus('disconnected');
            setQrCodeUrl(null);
        } catch (error) {
            showNotification('Failed to disconnect session', 'error');
        }
    };

    const fetchSessionData = async () => {
        try {
            const statusRes = await axios.get(`${API_URL}/api/${sessionId}/status`);
            setStatus(statusRes.data.status);
            if (statusRes.data.status === 'waiting for QR scan') {
                const qrRes = await axios.get(`${API_URL}/api/${sessionId}/qrcode`);
                setQrCodeUrl(qrRes.data.qrUrl);
            }
            const messagesRes = await axios.get(`${API_URL}/api/${sessionId}/messages`);
            setMessages(messagesRes.data.messages);
        } catch (error) {
            console.error("Error fetching session data:", error);
            showNotification('Failed to fetch session data.', 'error');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!sendTo || status !== 'connected') {
            showNotification('Number and connected status are required.', 'error');
            return;
        }

        if (!file && !sendMessageText) {
            showNotification('Message or file is required.', 'error');
            return;
        }

        setIsSending(true);

        if (file) {
            const formData = new FormData();
            formData.append('sessionId', sessionId);
            formData.append('number', sendTo);
            formData.append('message', sendMessageText);
            formData.append('media', file);
            // a simple way to determine mediaType, you might want a more robust solution
            const mediaType = file.type.startsWith('image') ? 'image' : 'document';
            formData.append('mediaType', mediaType);

            try {
                await axios.post(`${API_URL}/api/send-media`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                showNotification('Media message sent successfully!', 'success');
                setSendTo('');
                setSendMessageText('');
                setFile(null);
                // Clear the file input
                document.getElementById('file').value = '';
            } catch (error) {
                showNotification(error.response?.data?.details || 'Failed to send media message.', 'error');
            } finally {
                setIsSending(false);
            }
        } else {
            try {
                await axios.post(`${API_URL}/api/send-message`, {
                    sessionId,
                    number: sendTo,
                    message: sendMessageText,
                });
                showNotification('Message sent successfully!', 'success');
                setSendTo('');
                setSendMessageText('');
            } catch (error) {
                showNotification(error.response?.data?.details || 'Failed to send message.', 'error');
            } finally {
                setIsSending(false);
            }
        }
    };

    // ... (other handlers like handleSendBroadcast, handleSendMediaMessage, handleSaveWebhook need to be updated to include sessionId)

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">WhatsApp API Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <StatusBadge status={status} />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-4 rounded-lg shadow-lg">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Session Management</h2>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={sessionId}
                                    onChange={(e) => setSessionId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter session ID"
                                />
                                <button
                                    onClick={handleStartSession}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Start
                                </button>
                                <button
                                    onClick={handleDisconnectSession}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Stop
                                </button>
                            </div>
                        </div>
                        <QRCodeDisplay qrCodeUrl={qrCodeUrl} />
                        
                        {/* ... (rest of the UI) */}

                        <MessageSender 
                            sendTo={sendTo}
                            setSendTo={setSendTo}
                            sendMessageText={sendMessageText}
                            setSendMessageText={setSendMessageText}
                            isSending={isSending}
                            handleSendMessage={handleSendMessage}
                            status={status}
                            setFile={setFile}
                        />
                        
                        <WebhookManager 
                            webhookUrl={webhookUrl}
                            setWebhookUrl={setWebhookUrl}
                            isSavingWebhook={isSavingWebhook}
                            handleSaveWebhook={async (e) => {
                                e.preventDefault();
                                setIsSavingWebhook(true);
                                try {
                                    await axios.post(`${API_URL}/api/webhook`, { url: webhookUrl });
                                    showNotification('Webhook URL saved successfully!', 'success');
                                } catch (error) {
                                    showNotification(error.response?.data?.message || 'Failed to save webhook URL.', 'error');
                                } finally {
                                    setIsSavingWebhook(false);
                                }
                            }}
                        />

                        <BroadcastFromFile 
                            sessionId={sessionId}
                            status={status}
                            showNotification={showNotification}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <MessageLog messages={messages} messagesEndRef={messagesEndRef} />
                    </div>
                </div>
            </main>
        </div>
    );
}

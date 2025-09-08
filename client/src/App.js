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
import ServerToggle from './components/ServerToggle';

const API_URL = 'http://localhost:4000';

export default function App() {
    const [socket, setSocket] = useState(null);
    const [status, setStatus] = useState('connecting');
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [messages, setMessages] = useState([]);
    
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
        console.log('Initializing socket connection to:', API_URL);
        const newSocket = io(API_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        
        setSocket(newSocket);
        
        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            showNotification('Koneksi ke server berhasil', 'success');
        });
        
        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            showNotification('Koneksi ke server terputus', 'error');
        });
        
        newSocket.on('connect_error', (error) => {
            console.log('Socket connection error:', error);
            showNotification('Gagal terhubung ke server', 'error');
        });
        
        return () => {
            newSocket.close();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;
        
        const fetchInitialData = async () => {
            try {
                const statusRes = await axios.get(`${API_URL}/api/status`);
                setStatus(statusRes.data.status);
                if (statusRes.data.status === 'waiting for QR scan') {
                    const qrRes = await axios.get(`${API_URL}/api/qrcode`);
                    setQrCodeUrl(qrRes.data.qrUrl);
                }
                const messagesRes = await axios.get(`${API_URL}/api/messages`);
                setMessages(messagesRes.data.messages);
                const webhookRes = await axios.get(`${API_URL}/api/webhook`);
                setWebhookUrl(webhookRes.data.webhookUrl);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                showNotification('Gagal memuat data awal.', 'error');
            }
        };

        fetchInitialData();

        // Add debugging to see if events are being received
        socket.on('status', (newStatus) => {
            console.log('Received status update:', newStatus);
            setStatus(newStatus);
        });
        
        socket.on('qr_code', (url) => {
            console.log('Received QR code:', url);
            setQrCodeUrl(url);
        });
        
        socket.on('new_message', (newMessage) => {
            console.log('Received new message:', newMessage);
            setMessages(prevMessages => {
                // Create a new array with the new message at the beginning
                const updatedMessages = [newMessage, ...prevMessages];
                // Keep only the latest 100 messages
                return updatedMessages.slice(0, 100);
            });
        });

        return () => {
            socket.off('status');
            socket.off('qr_code');
            socket.off('new_message');
        };
    }, [socket]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Periodically refresh status to ensure it's up to date
    useEffect(() => {
        if (!socket) return;
        
        const interval = setInterval(async () => {
            if (status !== 'connected' && status !== 'waiting for QR scan') {
                try {
                    const statusRes = await axios.post(`${API_URL}/api/refresh-status`);
                    setStatus(statusRes.data.status);
                } catch (error) {
                    console.error("Error refreshing status:", error);
                }
            }
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval);
    }, [socket, status]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!sendTo || !sendMessageText || status !== 'connected') {
            showNotification('Nomor dan pesan harus diisi, dan status harus terhubung.', 'error');
            return;
        }
        setIsSending(true);
        try {
            await axios.post(`${API_URL}/api/send-message`, {
                number: sendTo,
                message: sendMessageText,
            });
            showNotification('Pesan berhasil dikirim!', 'success');
            setSendTo('');
            setSendMessageText('');
        } catch (error) {
            console.error("Error sending message:", error);
            showNotification(error.response?.data?.details || 'Gagal mengirim pesan.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handleSendBroadcast = async () => {
        // Use selected contacts if in contact mode, otherwise use manually entered recipients
        const numbersToSend = isContactMode ? 
            contacts.filter(contact => selectedContacts.includes(contact.id)).map(contact => contact.phone) :
            recipients;
            
        if (numbersToSend.length === 0 || !broadcastMessageText.trim() || status !== 'connected') {
            showNotification('Harus ada minimal satu penerima dan pesan harus diisi.', 'error');
            return;
        }
        
        setIsSending(true);
        setBroadcastProgress({ sent: 0, total: numbersToSend.length });
        
        let successCount = 0;
        let failCount = 0;
        
        try {
            // Send messages sequentially with delay
            for (let i = 0; i < numbersToSend.length; i++) {
                try {
                    await axios.post(`${API_URL}/api/send-message`, {
                        number: numbersToSend[i],
                        message: broadcastMessageText,
                    });
                    successCount++;
                } catch (error) {
                    failCount++;
                    console.error(`Error sending message to ${numbersToSend[i]}:`, error);
                }
                
                setBroadcastProgress({ sent: i + 1, total: numbersToSend.length });
                
                // Add delay between messages
                if (i < numbersToSend.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * 1000));
                }
            }
            
            if (failCount === 0) {
                showNotification(`Broadcast berhasil dikirim ke ${successCount} kontak!`, 'success');
            } else {
                showNotification(`Broadcast selesai: ${successCount} berhasil, ${failCount} gagal.`, successCount > 0 ? 'success' : 'error');
            }
            
            // Clear form after successful broadcast (only if not in contact mode)
            if (!isContactMode) {
                setRecipients([]);
            }
            setBroadcastMessageText('');
        } catch (error) {
            console.error("Error sending broadcast:", error);
            showNotification('Terjadi kesalahan saat mengirim broadcast.', 'error');
        } finally {
            setIsSending(false);
            setBroadcastProgress({ sent: 0, total: 0 });
        }
    };

    const handleSendMediaMessage = async (mediaUrl, mediaType) => {
        // Use selected contacts if in contact mode, otherwise use manually entered recipients
        const numbersToSend = isContactMode ? 
            contacts.filter(contact => selectedContacts.includes(contact.id)).map(contact => contact.phone) :
            mediaRecipients;
            
        if (numbersToSend.length === 0 || !mediaUrl.trim() || status !== 'connected') {
            showNotification('Harus ada minimal satu penerima dan URL media harus diisi.', 'error');
            return;
        }
        
        setIsSendingMedia(true);
        
        let successCount = 0;
        let failCount = 0;
        
        try {
            // Send media messages sequentially
            for (let i = 0; i < numbersToSend.length; i++) {
                try {
                    await axios.post(`${API_URL}/api/send-media`, {
                        number: numbersToSend[i],
                        message: mediaMessageText,
                        mediaUrl: mediaUrl,
                        mediaType: mediaType
                    });
                    successCount++;
                } catch (error) {
                    failCount++;
                    console.error(`Error sending media to ${numbersToSend[i]}:`, error);
                }
                
                // Add small delay between messages
                if (i < numbersToSend.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            if (failCount === 0) {
                showNotification(`Media berhasil dikirim ke ${successCount} kontak!`, 'success');
            } else {
                showNotification(`Pengiriman media selesai: ${successCount} berhasil, ${failCount} gagal.`, successCount > 0 ? 'success' : 'error');
            }
            
            // Clear form after successful broadcast (only if not in contact mode)
            if (!isContactMode) {
                setMediaRecipients([]);
            }
            setMediaMessageText('');
        } catch (error) {
            console.error("Error sending media message:", error);
            showNotification('Terjadi kesalahan saat mengirim media.', 'error');
        } finally {
            setIsSendingMedia(false);
        }
    };

    const handleSaveWebhook = async (e) => {
        e.preventDefault();
        setIsSavingWebhook(true);
        try {
            await axios.post(`${API_URL}/api/webhook`, { url: webhookUrl });
            showNotification('URL Webhook berhasil disimpan!', 'success');
        } catch (error) {
            console.error("Error saving webhook:", error);
            showNotification(error.response?.data?.message || 'Gagal menyimpan URL Webhook.', 'error');
        } finally {
            setIsSavingWebhook(false);
        }
    };

    const handleRefreshStatus = async () => {
        try {
            const statusRes = await axios.post(`${API_URL}/api/refresh-status`);
            setStatus(statusRes.data.status);
            showNotification('Status diperbarui.', 'success');
        } catch (error) {
            console.error("Error refreshing status:", error);
            showNotification('Gagal memperbarui status.', 'error');
        }
    };

    // Handle server toggle
    const handleToggleServer = async (action) => {
        try {
            const response = await axios.post(`${API_URL}/api/toggle-server`, { action });
            return response.data;
        } catch (error) {
            console.error("Error toggling server:", error);
            return { status: 'error', message: 'Failed to toggle server' };
        }
    };

    // Function to switch modes
    const switchToMode = (mode) => {
        setIsBroadcastMode(mode === 'broadcast');
        setIsMediaMode(mode === 'media');
        setIsContactMode(mode === 'contact');
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">WhatsApp API Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <StatusBadge status={status} />
                        <button
                            onClick={handleRefreshStatus}
                            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title="Refresh status"
                        >
                            <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <ServerToggle status={status} onToggle={handleToggleServer} />
                        <QRCodeDisplay qrCodeUrl={qrCodeUrl} />
                        
                        {/* Mode Selection */}
                        <div className="bg-white p-4 rounded-lg shadow-lg">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => switchToMode('single')}
                                    className={`px-3 py-2 text-sm rounded-md ${!isBroadcastMode && !isMediaMode && !isContactMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Pesan Tunggal
                                </button>
                                <button
                                    onClick={() => switchToMode('broadcast')}
                                    className={`px-3 py-2 text-sm rounded-md ${isBroadcastMode && !isMediaMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Broadcast
                                </button>
                                <button
                                    onClick={() => switchToMode('media')}
                                    className={`px-3 py-2 text-sm rounded-md ${isMediaMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Media
                                </button>
                                <button
                                    onClick={() => switchToMode('contact')}
                                    className={`px-3 py-2 text-sm rounded-md ${isContactMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Kontak
                                </button>
                            </div>
                        </div>
                        
                        {/* Mode-specific components */}
                        {isContactMode ? (
                            <ContactManager 
                                contacts={contacts}
                                setContacts={setContacts}
                                selectedContacts={selectedContacts}
                                setSelectedContacts={setSelectedContacts}
                                status={status}
                            />
                        ) : isMediaMode ? (
                            <MediaMessage 
                                mediaRecipients={mediaRecipients}
                                setMediaRecipients={setMediaRecipients}
                                mediaMessageText={mediaMessageText}
                                setMediaMessageText={setMediaMessageText}
                                isSendingMedia={isSendingMedia}
                                handleSendMediaMessage={handleSendMediaMessage}
                                status={status}
                            />
                        ) : isBroadcastMode ? (
                            <BroadcastMessage 
                                recipients={recipients}
                                setRecipients={setRecipients}
                                messageText={broadcastMessageText}
                                setMessageText={setBroadcastMessageText}
                                isSending={isSending}
                                handleSendBroadcast={handleSendBroadcast}
                                status={status}
                                delay={delay}
                                setDelay={setDelay}
                            />
                        ) : (
                            <MessageSender 
                                sendTo={sendTo}
                                setSendTo={setSendTo}
                                sendMessageText={sendMessageText}
                                setSendMessageText={setSendMessageText}
                                isSending={isSending}
                                handleSendMessage={handleSendMessage}
                                status={status}
                            />
                        )}
                        
                        {/* Progress indicator for broadcast */}
                        {isSending && (isBroadcastMode || isContactMode) && broadcastProgress.total > 0 && (
                            <div className="bg-white p-4 rounded-lg shadow-lg">
                                <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                                    <span>Mengirim broadcast...</span>
                                    <span>{broadcastProgress.sent} / {broadcastProgress.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-indigo-600 h-2 rounded-full" 
                                        style={{ width: `${(broadcastProgress.sent / broadcastProgress.total) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Jeda: {delay} detik antar pesan
                                </p>
                            </div>
                        )}
                        
                        <WebhookManager 
                            webhookUrl={webhookUrl}
                            setWebhookUrl={setWebhookUrl}
                            isSavingWebhook={isSavingWebhook}
                            handleSaveWebhook={handleSaveWebhook}
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
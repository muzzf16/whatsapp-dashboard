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

const API_URL = 'https://api.kenes.biz.id'; 

export default function App() {
    const [status, setStatus] = useState('connecting');
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [messages, setMessages] = useState([]);
    
    // Single message state
    const [sendTo, setSendTo] = useState('');
    const [sendMessageText, setSendMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const [webhookUrl, setWebhookUrl] = useState('');
    const [isSavingWebhook, setIsSavingWebhook] = useState(false);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [broadcastProgress, setBroadcastProgress] = useState({ sent: 0, total: 0 });
    
    const messagesEndRef = useRef(null);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 4000);
    };

    useEffect(() => {
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

        socket.on('status', newStatus => setStatus(newStatus));
        socket.on('qr_code', url => setQrCodeUrl(url));
        socket.on('new_message', newMessage => {
            setMessages(prevMessages => [newMessage, ...prevMessages]);
        });

        return () => {
            socket.off('status');
            socket.off('qr_code');
            socket.off('new_message');
            socket.off('new_outgoing_message');
        };
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, outgoingMessages]);


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

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            <header className="bg-white shadow-md p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">WhatsApp API Dashboard</h1>
                <StatusBadge status={status} />
            </header>

            <main className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        {status === 'waiting for QR scan' && qrCodeUrl && (
                             <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                                <h2 className="text-xl font-semibold mb-4">Scan untuk Login</h2>
                                <img src={qrCodeUrl} alt="QR Code" className="mx-auto border-4 border-gray-200 rounded-lg"/>
                                <p className="mt-4 text-gray-600">Buka WhatsApp di ponsel Anda, lalu pindai kode ini.</p>
                             </div>
                        )}

                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Kirim Pesan</h2>
                            <form onSubmit={handleSendMessage} className="space-y-4">
                                <div>
                                    <label htmlFor="number" className="block text-sm font-medium text-gray-700">Nomor Tujuan</label>
                                    <input
                                        type="text"
                                        id="number"
                                        value={sendTo}
                                        onChange={(e) => setSendTo(e.target.value)}
                                        placeholder="Contoh: 6281234567890"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        disabled={status !== 'connected'}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Isi Pesan</label>
                                    <textarea
                                        id="message"
                                        rows="4"
                                        value={sendMessageText}
                                        onChange={(e) => setSendMessageText(e.target.value)}
                                        placeholder="Ketik pesan Anda di sini..."
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        disabled={status !== 'connected'}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSending || status !== 'connected'}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Start
                                </button>
                            </form>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Manajemen Webhook</h2>
                            <form onSubmit={handleSaveWebhook} className="space-y-4">
                                <div>
                                    <label htmlFor="webhookUrl" className="block text-sm font-medium text-gray-700">Webhook URL</label>
                                    <input
                                        type="url"
                                        id="webhookUrl"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        placeholder="https://example.com/webhook"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                     <p className="text-xs text-gray-500 mt-1">
                                        Server akan mengirim pesan masuk ke URL ini.
                                    </p>
                                </div>
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

                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Log Pesan Masuk</h2>
                        <div className="h-96 overflow-y-auto space-y-4 pr-2">
                           {messages.length > 0 ? messages.map((msg, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-md border-l-4 border-green-500">
                                    <p className="font-bold text-gray-800">{msg.from.split('@')[0]}</p>
                                    <p className="text-gray-700">{msg.text}</p>
                                    <p className="text-xs text-gray-500 mt-1 text-right">{new Date(msg.timestamp).toLocaleString()}</p>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 mt-10">Belum ada pesan masuk.</p>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:4000';
const socket = io(API_URL);

const StatusBadge = ({ status }) => {
    const statusMap = {
        connected: { text: 'Terhubung', color: 'bg-green-500' },
        connecting: { text: 'Menghubungkan...', color: 'bg-yellow-500' },
        disconnected: { text: 'Terputus', color: 'bg-red-500' },
        'waiting for QR scan': { text: 'Menunggu Scan QR', color: 'bg-blue-500' },
        'logged out': { text: 'Keluar', color: 'bg-gray-500' },
    };
    const { text, color } = statusMap[status] || { text: 'Unknown', color: 'bg-gray-500' };
    
    return (
        <div className="flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${color} animate-pulse`}></span>
            <span className="text-sm font-medium text-gray-700">{text}</span>
        </div>
    );
};

const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    const baseClasses = 'fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white transition-opacity duration-300 z-50';
    const typeClasses = type === 'success' ? 'bg-green-600' : 'bg-red-600';

    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <span>{message}</span>
            <button onClick={onClose} className="ml-4 font-bold">X</button>
        </div>
    );
};


export default function App() {
    const [connections, setConnections] = useState([]);
    const [activeConnectionId, setActiveConnectionId] = useState('');
    const [newConnectionId, setNewConnectionId] = useState('');
    
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [messages, setMessages] = useState([]);
    const [outgoingMessages, setOutgoingMessages] = useState([]);
    const [messageFilter, setMessageFilter] = useState('');
    const [activeTab, setActiveTab] = useState('incoming');
    
    const [sendTo, setSendTo] = useState('');
    const [sendMessageText, setSendMessageText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSending, setIsSending] = useState(false);

    const [broadcastNumbers, setBroadcastNumbers] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookSecret, setWebhookSecret] = useState('');
    const [isSavingWebhook, setIsSavingWebhook] = useState(false);
    
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    const messagesEndRef = useRef(null);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 4000);
    };

    const fetchConnections = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/connections`);
            setConnections(res.data);
            if (res.data.length > 0 && !activeConnectionId) {
                setActiveConnectionId(res.data[0].connectionId);
            }
        } catch (error) {
            console.error("Error fetching connections:", error);
        }
    };

    useEffect(() => {
        fetchConnections();
        const fetchInitialData = async () => {
            try {
                const webhookRes = await axios.get(`${API_URL}/api/webhook`);
                setWebhookUrl(webhookRes.data.webhookUrl);
                setWebhookSecret(webhookRes.data.webhookSecret);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                showNotification('Gagal memuat data awal.', 'error');
            }
        };

        fetchInitialData();

        socket.on('status', ({ connectionId, status }) => {
            setConnections(prev => prev.map(c => c.connectionId === connectionId ? { ...c, status } : c));
        });

        socket.on('qr_code', ({ connectionId, qrUrl }) => {
            if (connectionId === activeConnectionId) {
                setQrCodeUrl(qrUrl);
            }
        });

        socket.on('new_message', ({ connectionId, log }) => {
            if (connectionId === activeConnectionId) {
                setMessages(prevMessages => [log, ...prevMessages]);
            }
        });

        socket.on('new_outgoing_message', ({ connectionId, log }) => {
            if (connectionId === activeConnectionId) {
                setOutgoingMessages(prevOutgoingMessages => [log, ...prevOutgoingMessages]);
            }
        });

        return () => {
            socket.off('status');
            socket.off('qr_code');
            socket.off('new_message');
            socket.off('new_outgoing_message');
        };
    }, [activeConnectionId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, outgoingMessages]);

    useEffect(() => {
        const fetchConnectionData = async () => {
            if (activeConnectionId) {
                try {
                    const messagesRes = await axios.get(`${API_URL}/api/${activeConnectionId}/messages`);
                    setMessages(messagesRes.data.messages);
                    const outgoingMessagesRes = await axios.get(`${API_URL}/api/${activeConnectionId}/outgoing-messages`);
                    setOutgoingMessages(outgoingMessagesRes.data.messages);
                    const qrRes = await axios.get(`${API_URL}/api/${activeConnectionId}/qrcode`);
                    setQrCodeUrl(qrRes.data.qrUrl);
                } catch (error) {
                    console.error(`Error fetching data for ${activeConnectionId}:`, error);
                }
            }
        };
        fetchConnectionData();
    }, [activeConnectionId]);

    const handleAddConnection = async () => {
        if (!newConnectionId) {
            showNotification('Connection ID harus diisi.', 'error');
            return;
        }
        try {
            await axios.post(`${API_URL}/api/connections/start`, { connectionId: newConnectionId });
            setConnections(prev => [...prev, { connectionId: newConnectionId, status: 'connecting' }]);
            setActiveConnectionId(newConnectionId);
            setNewConnectionId('');
            showNotification(`Koneksi ${newConnectionId} dimulai.`, 'success');
        } catch (error) {
            console.error("Error starting connection:", error);
            showNotification('Gagal memulai koneksi.', 'error');
        }
    };

    const handleDisconnectConnection = async (connectionId) => {
        try {
            await axios.post(`${API_URL}/api/connections/disconnect`, { connectionId });
            setConnections(prev => prev.filter(c => c.connectionId !== connectionId));
            if (activeConnectionId === connectionId) {
                setActiveConnectionId(connections[0]?.connectionId || '');
            }
            showNotification(`Koneksi ${connectionId} diputus.`, 'success');
        } catch (error) {
            console.error("Error disconnecting connection:", error);
            showNotification('Gagal memutus koneksi.', 'error');
        }
    };
    
    const handleDisconnectAllConnections = async () => {
        try {
            await axios.post(`${API_URL}/api/connections/disconnect-all`);
            setConnections([]);
            setActiveConnectionId('');
            showNotification('Semua koneksi diputus.', 'success');
        } catch (error) {
            console.error("Error disconnecting all connections:", error);
            showNotification('Gagal memutus semua koneksi.', 'error');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 25 * 1024 * 1024) {
            showNotification('Ukuran file tidak boleh melebihi 25MB.', 'error');
            e.target.value = null;
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const activeConnection = connections.find(c => c.connectionId === activeConnectionId);
        if (!sendTo || (!sendMessageText && !selectedFile) || activeConnection?.status !== 'connected') {
            showNotification('Nomor dan (pesan atau file) harus diisi, dan status harus terhubung.', 'error');
            return;
        }
        setIsSending(true);

        let fileData = null;
        if (selectedFile) {
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = async () => {
                const base64 = reader.result.split(',')[1];
                fileData = {
                    name: selectedFile.name,
                    type: selectedFile.type,
                    base64: base64,
                };
                await sendMessageRequest(fileData);
            };
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                showNotification('Gagal membaca file.', 'error');
                setIsSending(false);
            };
        } else {
            await sendMessageRequest(null);
        }
    };

    const sendMessageRequest = async (file) => {
        try {
            await axios.post(`${API_URL}/api/${activeConnectionId}/send-message`, {
                number: sendTo,
                message: sendMessageText,
                file: file,
            });
            showNotification('Pesan berhasil dikirim!', 'success');
            setSendTo('');
            setSendMessageText('');
            setSelectedFile(null);
        } catch (error) {
            console.error("Error sending message:", error);
            showNotification(error.response?.data?.details || 'Gagal mengirim pesan.', 'error');
        } finally {
            setIsSending(false);
        }
    }

    const handleBroadcastMessage = async (e) => {
        e.preventDefault();
        const activeConnection = connections.find(c => c.connectionId === activeConnectionId);
        if (!broadcastNumbers || !broadcastMessage || activeConnection?.status !== 'connected') {
            showNotification('Nomor dan pesan broadcast harus diisi, dan status harus terhubung.', 'error');
            return;
        }
        setIsBroadcasting(true);
        const numbers = broadcastNumbers.split('\n').filter(n => n.trim() !== '');
        try {
            await axios.post(`${API_URL}/api/${activeConnectionId}/broadcast-message`, {
                numbers: numbers,
                message: broadcastMessage,
            });
            showNotification('Pesan broadcast berhasil dikirim!', 'success');
            setBroadcastNumbers('');
            setBroadcastMessage('');
        } catch (error) {
            console.error("Error sending broadcast message:", error);
            showNotification(error.response?.data?.details || 'Gagal mengirim pesan broadcast.', 'error');
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleSaveWebhook = async (e) => {
        e.preventDefault();
        setIsSavingWebhook(true);
        try {
            await axios.post(`${API_URL}/api/webhook`, { url: webhookUrl, secret: webhookSecret });
            showNotification('Pengaturan webhook berhasil disimpan!', 'success');
        } catch (error) {
            console.error("Error saving webhook:", error);
            showNotification(error.response?.data?.message || 'Gagal menyimpan pengaturan webhook.', 'error');
        } finally {
            setIsSavingWebhook(false);
        }
    };

    const filteredMessages = messages.filter(msg => 
        messageFilter ? msg.from.includes(messageFilter) : true
    );

    const filteredOutgoingMessages = outgoingMessages.filter(msg => 
        messageFilter ? msg.to.includes(messageFilter) : true
    );

    const activeConnection = connections.find(c => c.connectionId === activeConnectionId);

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            <header className="bg-white shadow-md p-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">WhatsApp API Dashboard</h1>
                {activeConnection && <StatusBadge status={activeConnection.status} />}
            </header>

            <main className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Manajemen Koneksi</h2>
                            <div className="space-y-4">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newConnectionId}
                                        onChange={(e) => setNewConnectionId(e.target.value)}
                                        placeholder="ID Koneksi Baru"
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <button
                                        onClick={handleAddConnection}
                                        className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Mulai
                                    </button>
                                </div>
                                <select
                                    value={activeConnectionId}
                                    onChange={(e) => setActiveConnectionId(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Pilih Koneksi</option>
                                    {connections.map(conn => (
                                        <option key={conn.connectionId} value={conn.connectionId}>{conn.connectionId} ({conn.status})</option>
                                    ))}
                                </select>
                                <div className="flex space-x-2">
                                    {activeConnectionId && (
                                        <button
                                            onClick={() => handleDisconnectConnection(activeConnectionId)}
                                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            Putuskan Koneksi
                                        </button>
                                    )}
                                    <button
                                        onClick={handleDisconnectAllConnections}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                    >
                                        Putuskan Semua
                                    </button>
                                </div>
                            </div>
                        </div>

                        {activeConnection?.status === 'waiting for QR scan' && qrCodeUrl && (
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
                                        placeholder="Contoh: 6281234567890 atau group-id@g.us"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        disabled={activeConnection?.status !== 'connected'}
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
                                        disabled={activeConnection?.status !== 'connected'}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="file" className="block text-sm font-medium text-gray-700">File (max 25MB)</label>
                                    <input
                                        type="file"
                                        id="file"
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        disabled={activeConnection?.status !== 'connected'}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSending || activeConnection?.status !== 'connected'}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isSending ? 'Mengirim...' : 'Kirim Sekarang'}
                                </button>
                            </form>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Kirim Pesan Broadcast</h2>
                            <form onSubmit={handleBroadcastMessage} className="space-y-4">
                                <div>
                                    <label htmlFor="broadcastNumbers" className="block text-sm font-medium text-gray-700">Nomor Tujuan (satu per baris)</label>
                                    <textarea
                                        id="broadcastNumbers"
                                        rows="4"
                                        value={broadcastNumbers}
                                        onChange={(e) => setBroadcastNumbers(e.target.value)}
                                        placeholder="6281234567890\n6281234567891"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        disabled={activeConnection?.status !== 'connected'}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="broadcastMessage" className="block text-sm font-medium text-gray-700">Isi Pesan</label>
                                    <textarea
                                        id="broadcastMessage"
                                        rows="4"
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        placeholder="Ketik pesan Anda di sini..."
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        disabled={activeConnection?.status !== 'connected'}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isBroadcasting || activeConnection?.status !== 'connected'}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isBroadcasting ? 'Mengirim Broadcast...' : 'Kirim Broadcast'}
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
                                </div>
                                <div>
                                    <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700">Webhook Secret</label>
                                    <input
                                        type="text"
                                        id="webhookSecret"
                                        value={webhookSecret}
                                        onChange={(e) => setWebhookSecret(e.target.value)}
                                        placeholder="Rahasia untuk webhook"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSavingWebhook}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                                >
                                    {isSavingWebhook ? 'Menyimpan...' : 'Simpan Webhook'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex border-b border-gray-200">
                                <button
                                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'incoming' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('incoming')}
                                >
                                    Pesan Masuk
                                </button>
                                <button
                                    className={`px-4 py-2 text-sm font-medium ${activeTab === 'outgoing' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveTab('outgoing')}
                                >
                                    Pesan Keluar
                                </button>
                            </div>
                            <input
                                type="text"
                                placeholder="Filter berdasarkan nomor..."
                                value={messageFilter}
                                onChange={(e) => setMessageFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="h-96 overflow-y-auto space-y-4 pr-2">
                           {activeTab === 'incoming' && (filteredMessages.length > 0 ? filteredMessages.map((msg, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-md border-l-4 border-green-500">
                                    <p className="font-bold text-gray-800">
                                        {msg.groupName ? `${msg.groupName} (${msg.senderName})` : msg.from.split('@')[0]}
                                    </p>
                                    <p className="text-gray-700">{msg.text}</p>
                                    <p className="text-xs text-gray-500 mt-1 text-right">{new Date(msg.timestamp).toLocaleString()}</p>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 mt-10">Belum ada pesan masuk untuk koneksi ini.</p>
                            ))}
                            {activeTab === 'outgoing' && (filteredOutgoingMessages.length > 0 ? filteredOutgoingMessages.map((msg, index) => (
                                <div key={index} className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-500">
                                    <p className="font-bold text-gray-800">To: {msg.to.split('@')[0]}</p>
                                    <p className="text-gray-700">{msg.text}</p>
                                    {msg.file && <p className="text-sm text-gray-500">File: {msg.file}</p>}
                                    <div className="flex justify-between items-center mt-1">
                                        <p className={`text-xs font-semibold ${msg.status === 'sent' ? 'text-green-500' : 'text-red-500'}`}>{msg.status}</p>
                                        <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 mt-10">Belum ada pesan keluar untuk koneksi ini.</p>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}


import React, { useState } from 'react';

export default function BroadcastFromFile({ sessionId, status, showNotification }) {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');
    const [delay, setDelay] = useState(5);
    const [isSending, setIsSending] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSendBroadcast = async () => {
        if (!file || !message || status !== 'connected') {
            showNotification('File, message, and connected status are required.', 'error');
            return;
        }

        setIsSending(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('message', message);
        formData.append('delay', delay);
        formData.append('sessionId', sessionId);

        try {
            // This endpoint needs to be created on the backend
            await axios.post('/api/broadcast-from-file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            showNotification('Broadcast started successfully!', 'success');
        } catch (error) {
            showNotification(error.response?.data?.message || 'Failed to start broadcast.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Broadcast from File</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                        Contact File (CSV/Excel)
                    </label>
                    <input
                        type="file"
                        id="file"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                        Message Template
                    </label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows="4"
                        placeholder="Enter your message template here."
                    />
                </div>
                <div>
                    <label htmlFor="delay" className="block text-sm font-medium text-gray-700">
                        Delay (seconds)
                    </label>
                    <input
                        type="number"
                        id="delay"
                        value={delay}
                        onChange={(e) => setDelay(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        min="1"
                    />
                </div>
                <button
                    onClick={handleSendBroadcast}
                    disabled={isSending || status !== 'connected'}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                    {isSending ? 'Sending...' : 'Send Broadcast'}
                </button>
            </div>
        </div>
    );
}

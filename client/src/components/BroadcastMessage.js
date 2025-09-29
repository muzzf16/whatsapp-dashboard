import React, { useState } from 'react';

const BroadcastMessage = ({ 
    recipients, 
    setRecipients, 
    messageText, 
    setMessageText, 
    isSending, 
    handleSendBroadcast,
    status,
    delay,
    setDelay
}) => {
    const [recipientInput, setRecipientInput] = useState('');

    const handleAddRecipient = (e) => {
        e.preventDefault();
        if (recipientInput.trim() && !recipients.includes(recipientInput.trim())) {
            setRecipients([...recipients, recipientInput.trim()]);
            setRecipientInput('');
        }
    };

    const handleRemoveRecipient = (index) => {
        const newRecipients = [...recipients];
        newRecipients.splice(index, 1);
        setRecipients(newRecipients);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Broadcast Pesan</h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Penerima</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={recipientInput}
                            onChange={(e) => setRecipientInput(e.target.value)}
                            placeholder="Contoh: 6281234567890"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={status !== 'connected' || isSending}
                        />
                        <button
                            type="button"
                            onClick={handleAddRecipient}
                            disabled={!recipientInput.trim() || status !== 'connected' || isSending}
                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tambah
                        </button>
                    </div>
                    {recipients.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {recipients.map((recipient, index) => (
                                <div key={index} className="flex items-center bg-indigo-100 rounded-full px-3 py-1">
                                    <span className="text-sm text-indigo-800">{recipient}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRecipient(index)}
                                        disabled={isSending}
                                        className="ml-2 text-indigo-500 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <label htmlFor="broadcastMessage" className="block text-sm font-medium text-gray-700">Isi Pesan</label>
                    <textarea
                        id="broadcastMessage"
                        rows="4"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Ketik pesan Anda di sini..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={status !== 'connected' || isSending}
                    />
                </div>
                <div>
                    <label htmlFor="delay" className="block text-sm font-medium text-gray-700">Jeda Pengiriman (detik)</label>
                    <select
                        id="delay"
                        value={delay}
                        onChange={(e) => setDelay(parseInt(e.target.value))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={status !== 'connected' || isSending}
                    >
                        <option value={1}>1 detik</option>
                        <option value={2}>2 detik</option>
                        <option value={3}>3 detik</option>
                        <option value={5}>5 detik</option>
                        <option value={10}>10 detik</option>
                        <option value={15}>15 detik</option>
                        <option value={30}>30 detik</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                        Jeda waktu antar pesan untuk menghindari deteksi spam
                    </p>
                </div>
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Total penerima: {recipients.length}
                    </div>
                    <button
                        type="button"
                        onClick={handleSendBroadcast}
                        disabled={isSending || recipients.length === 0 || !messageText.trim() || status !== 'connected'}
                        className="flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSending ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Mengirim...
                            </div>
                        ) : 'Kirim Broadcast'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BroadcastMessage;
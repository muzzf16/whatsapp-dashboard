import React, { useState } from 'react';

const MediaMessage = ({ 
    mediaRecipients, 
    setMediaRecipients, 
    mediaMessageText, 
    setMediaMessageText, 
    isSendingMedia, 
    handleSendMediaMessage,
    status 
}) => {
    const [recipientInput, setRecipientInput] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaType, setMediaType] = useState('image');

    const handleAddRecipient = (e) => {
        e.preventDefault();
        if (recipientInput.trim() && !mediaRecipients.includes(recipientInput.trim())) {
            setMediaRecipients([...mediaRecipients, recipientInput.trim()]);
            setRecipientInput('');
        }
    };

    const handleRemoveRecipient = (index) => {
        const newRecipients = [...mediaRecipients];
        newRecipients.splice(index, 1);
        setMediaRecipients(newRecipients);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSendMediaMessage(mediaUrl, mediaType);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Kirim Media</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Penerima</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={recipientInput}
                            onChange={(e) => setRecipientInput(e.target.value)}
                            placeholder="Contoh: 6281234567890"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={status !== 'connected' || isSendingMedia}
                        />
                        <button
                            type="button"
                            onClick={handleAddRecipient}
                            disabled={!recipientInput.trim() || status !== 'connected' || isSendingMedia}
                            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Tambah
                        </button>
                    </div>
                    {mediaRecipients.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {mediaRecipients.map((recipient, index) => (
                                <div key={index} className="flex items-center bg-indigo-100 rounded-full px-3 py-1">
                                    <span className="text-sm text-indigo-800">{recipient}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRecipient(index)}
                                        disabled={isSendingMedia}
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
                    <label htmlFor="mediaType" className="block text-sm font-medium text-gray-700">Jenis Media</label>
                    <select
                        id="mediaType"
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={status !== 'connected' || isSendingMedia}
                    >
                        <option value="image">Gambar</option>
                        <option value="document">Dokumen</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="mediaUrl" className="block text-sm font-medium text-gray-700">URL Media</label>
                    <input
                        type="url"
                        id="mediaUrl"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={status !== 'connected' || isSendingMedia}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        Masukkan URL langsung ke file gambar atau dokumen
                    </p>
                </div>
                <div>
                    <label htmlFor="mediaMessage" className="block text-sm font-medium text-gray-700">Caption (Opsional)</label>
                    <textarea
                        id="mediaMessage"
                        rows="3"
                        value={mediaMessageText}
                        onChange={(e) => setMediaMessageText(e.target.value)}
                        placeholder="Tambahkan caption untuk media Anda..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={status !== 'connected' || isSendingMedia}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Total penerima: {mediaRecipients.length}
                    </div>
                    <button
                        type="submit"
                        disabled={isSendingMedia || mediaRecipients.length === 0 || !mediaUrl.trim() || status !== 'connected'}
                        className="flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSendingMedia ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Mengirim...
                            </div>
                        ) : 'Kirim Media'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MediaMessage;
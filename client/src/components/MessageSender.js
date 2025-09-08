import React from 'react';

const MessageSender = ({ 
    sendTo, 
    setSendTo, 
    sendMessageText, 
    setSendMessageText, 
    isSending, 
    handleSendMessage, 
    status 
}) => {
    return (
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
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSending || status !== 'connected'}
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
                        ) : 'Kirim Pesan'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MessageSender;
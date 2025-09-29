import React from 'react';

const MessageLog = ({ messages, messagesEndRef }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Log Pesan Masuk</h2>
            <div className="flex-1 overflow-y-auto message-log-container pr-2 space-y-4">
                {messages.length > 0 ? messages.map((msg, index) => {
                    // Format timestamp
                    const date = new Date(msg.timestamp);
                    const timeString = isNaN(date.getTime()) 
                        ? 'Waktu tidak tersedia' 
                        : date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    const dateString = isNaN(date.getTime()) 
                        ? '' 
                        : date.toLocaleDateString('id-ID');
                        
                    return (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500 hover:bg-gray-100 transition-colors duration-150">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-gray-800 truncate">{msg.from ? msg.from.split('@')[0] : 'Unknown'}</p>
                                <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                    {timeString}
                                </p>
                            </div>
                            <p className="text-gray-700 mt-2 break-words">{msg.text || 'Pesan tidak tersedia'}</p>
                            <p className="text-xs text-gray-500 mt-2 text-right">
                                {dateString}
                            </p>
                        </div>
                    );
                }) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                                </svg>
                            </div>
                            <p className="text-gray-500">Belum ada pesan masuk.</p>
                            <p className="text-gray-400 text-sm mt-1">Pesan yang diterima akan muncul di sini.</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default MessageLog;
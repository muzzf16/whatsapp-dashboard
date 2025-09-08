import React, { useState, useEffect } from 'react';

const ServerToggle = ({ status, onToggle }) => {
    const [isToggling, setIsToggling] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const isConnected = status === 'connected';
    
    const handleToggle = async () => {
        setIsToggling(true);
        try {
            const action = isConnected ? 'disconnect' : 'connect';
            const response = await onToggle(action);
            
            if (response.status === 'success') {
                setNotification({ 
                    message: isConnected ? 'Server disconnected successfully' : 'Server connection initiated', 
                    type: 'success' 
                });
            } else {
                setNotification({ 
                    message: response.message || 'Failed to toggle server', 
                    type: 'error' 
                });
            }
        } catch (error) {
            console.error('Error toggling server:', error);
            setNotification({ 
                message: 'Error toggling server connection', 
                type: 'error' 
            });
        } finally {
            setIsToggling(false);
            
            // Clear notification after 3 seconds
            setTimeout(() => {
                setNotification({ message: '', type: '' });
            }, 3000);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Server Connection</h2>
            
            {notification.message && (
                <div className={`mb-4 p-3 rounded-md text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center">
                    <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                        {isConnected ? 'Connected to WhatsApp' : 'Disconnected'}
                    </span>
                </div>
                
                <button
                    onClick={handleToggle}
                    disabled={isToggling}
                    className={`px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isConnected 
                            ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    } ${isToggling ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                    {isToggling ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isConnected ? 'Disconnecting...' : 'Connecting...'}
                        </div>
                    ) : isConnected ? (
                        'Disconnect Server'
                    ) : (
                        'Connect Server'
                    )}
                </button>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
                <p>
                    {isConnected 
                        ? 'When you disconnect, you will need to scan the QR code again to reconnect.' 
                        : 'Connect to WhatsApp to start sending and receiving messages.'}
                </p>
            </div>
        </div>
    );
};

export default ServerToggle;
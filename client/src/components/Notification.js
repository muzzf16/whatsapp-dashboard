import React, { useEffect } from 'react';

const Notification = ({ message, type, onClose }) => {
    // Auto close after 5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;
    
    const baseClasses = 'fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white transition-opacity duration-300 z-50 flex items-start';
    const typeClasses = type === 'success' 
        ? 'bg-green-500' 
        : type === 'error' 
            ? 'bg-red-500' 
            : 'bg-blue-500';

    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <div className="flex-1">
                <span>{message}</span>
            </div>
            <button 
                onClick={onClose} 
                className="ml-4 font-bold text-white hover:text-gray-200 focus:outline-none"
            >
                ×
            </button>
        </div>
    );
};

export default Notification;
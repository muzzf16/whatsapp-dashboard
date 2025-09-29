import React from 'react';

const ModeToggle = ({ isBroadcastMode, setIsBroadcastMode, status }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Mode Pengiriman</h3>
                    <p className="text-sm text-gray-500">
                        {isBroadcastMode ? 'Broadcast ke banyak kontak' : 'Pesan tunggal'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsBroadcastMode(!isBroadcastMode)}
                    disabled={status !== 'connected'}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isBroadcastMode ? 'bg-indigo-600' : 'bg-gray-200'} ${status !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    role="switch"
                    aria-checked={isBroadcastMode}
                >
                    <span className="sr-only">Toggle mode</span>
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isBroadcastMode ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                </button>
            </div>
            <div className="mt-3 text-sm text-gray-500">
                <p>
                    {isBroadcastMode 
                        ? 'Anda sedang dalam mode broadcast. Tambahkan beberapa nomor untuk mengirim pesan ke banyak kontak sekaligus.' 
                        : 'Anda sedang dalam mode pesan tunggal. Kirim pesan ke satu nomor saja.'}
                </p>
            </div>
        </div>
    );
};

export default ModeToggle;
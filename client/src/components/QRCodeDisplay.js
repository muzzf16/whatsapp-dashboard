import React from 'react';

const QRCodeDisplay = ({ qrCodeUrl }) => {
    if (!qrCodeUrl) return null;
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-semibold mb-4">Scan untuk Login</h2>
            <div className="flex justify-center">
                <img src={qrCodeUrl} alt="QR Code" className="border-4 border-gray-200 rounded-lg p-2 bg-white" />
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 font-medium">Instruksi:</p>
                <ol className="text-blue-700 text-sm mt-2 text-left list-decimal list-inside space-y-1">
                    <li>Buka WhatsApp di ponsel Anda</li>
                    <li>Ketuk menu "Linked Devices"</li>
                    <li>Pilih "Link a Device"</li>
                    <li>Pindai kode QR di atas</li>
                </ol>
            </div>
        </div>
    );
};

export default QRCodeDisplay;
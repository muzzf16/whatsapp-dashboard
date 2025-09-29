import React from 'react';

const WebhookManager = ({ 
    webhookUrl, 
    setWebhookUrl, 
    isSavingWebhook, 
    handleSaveWebhook 
}) => {
    return (
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
                    <p className="text-xs text-gray-500 mt-1">
                        Server akan mengirim pesan masuk ke URL ini.
                    </p>
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSavingWebhook}
                        className="flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSavingWebhook ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Menyimpan...
                            </div>
                        ) : 'Simpan Webhook'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default WebhookManager;
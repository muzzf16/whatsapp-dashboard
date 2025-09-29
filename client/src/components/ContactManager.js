import React, { useState, useEffect } from 'react';

const ContactManager = ({ 
    contacts, 
    setContacts, 
    selectedContacts, 
    setSelectedContacts,
    status
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const API_URL = 'http://localhost:4000';

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    // Fetch contacts on component mount
    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await fetch(`${API_URL}/api/contacts`);
            const data = await response.json();
            if (data.status === 'success') {
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    const searchContacts = async (query) => {
        if (!query) {
            fetchContacts();
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/contacts/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (data.status === 'success') {
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error('Error searching contacts:', error);
        }
    };

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        searchContacts(term);
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        if (!phone) {
            showNotification('Nomor telepon harus diisi', 'error');
            return;
        }

        setIsAdding(true);
        try {
            const response = await fetch(`${API_URL}/api/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, phone }),
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                showNotification('Kontak berhasil ditambahkan', 'success');
                setName('');
                setPhone('');
                fetchContacts();
            } else {
                showNotification(data.message || 'Gagal menambahkan kontak', 'error');
            }
        } catch (error) {
            console.error('Error adding contact:', error);
            showNotification('Terjadi kesalahan saat menambahkan kontak', 'error');
        } finally {
            setIsAdding(false);
        }
    };

    const handleUploadContacts = async (e) => {
        e.preventDefault();
        if (!file) {
            showNotification('File harus dipilih', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const response = await fetch(`${API_URL}/api/contacts/upload`, {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                showNotification(`${data.insertedCount} kontak berhasil diunggah`, 'success');
                setFile(null);
                fetchContacts();
            } else {
                showNotification(data.message || 'Gagal mengunggah kontak', 'error');
            }
        } catch (error) {
            console.error('Error uploading contacts:', error);
            showNotification('Terjadi kesalahan saat mengunggah kontak', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSelectContact = (contactId) => {
        if (selectedContacts.includes(contactId)) {
            setSelectedContacts(selectedContacts.filter(id => id !== contactId));
        } else {
            setSelectedContacts([...selectedContacts, contactId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedContacts.length === contacts.length) {
            setSelectedContacts([]);
        } else {
            setSelectedContacts(contacts.map(contact => contact.id));
        }
    };

    const handleDeleteContact = async (contactId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus kontak ini?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/contacts/${contactId}`, {
                method: 'DELETE',
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                showNotification('Kontak berhasil dihapus', 'success');
                fetchContacts();
                // Remove from selected contacts if it was selected
                if (selectedContacts.includes(contactId)) {
                    setSelectedContacts(selectedContacts.filter(id => id !== contactId));
                }
            } else {
                showNotification(data.message || 'Gagal menghapus kontak', 'error');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            showNotification('Terjadi kesalahan saat menghapus kontak', 'error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Manajemen Kontak</h2>
            
            {notification.message && (
                <div className={`mb-4 p-3 rounded-md text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {notification.message}
                </div>
            )}

            {/* Add Contact Form */}
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Tambah Kontak</h3>
                <form onSubmit={handleAddContact} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama (Opsional)</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isAdding || status !== 'connected'}
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Nomor Telepon *</label>
                            <input
                                type="text"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="6281234567890"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isAdding || status !== 'connected'}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding || status !== 'connected'}
                        className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isAdding ? 'Menambahkan...' : 'Tambah Kontak'}
                    </button>
                </form>
            </div>

            {/* Upload Contacts */}
            <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Unggah Kontak</h3>
                <form onSubmit={handleUploadContacts} className="space-y-3">
                    <div>
                        <label htmlFor="file" className="block text-sm font-medium text-gray-700">File CSV/Excel</label>
                        <input
                            type="file"
                            id="file"
                            accept=".csv,.xls,.xlsx"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isUploading || status !== 'connected'}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Format yang didukung: CSV, XLS, XLSX
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={isUploading || !file || status !== 'connected'}
                        className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isUploading ? 'Mengunggah...' : 'Unggah Kontak'}
                    </button>
                </form>
            </div>

            {/* Search and Contact List */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">Daftar Kontak</h3>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearch}
                            placeholder="Cari kontak..."
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    fetchContacts();
                                }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {contacts.length > 0 ? (
                    <div className="border border-gray-200 rounded-md">
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedContacts.length === contacts.length && contacts.length > 0}
                                    onChange={handleSelectAll}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    {selectedContacts.length} dari {contacts.length} dipilih
                                </span>
                            </div>
                            <span className="text-sm text-gray-500">
                                Total: {contacts.length} kontak
                            </span>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                            {contacts.map((contact) => (
                                <div key={contact.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedContacts.includes(contact.id)}
                                            onChange={() => handleSelectContact(contact.id)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {contact.name || 'Tidak ada nama'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {contact.phone}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteContact(contact.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada kontak</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Tambahkan kontak baru atau unggah file untuk memulai.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactManager;
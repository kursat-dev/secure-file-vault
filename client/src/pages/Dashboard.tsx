import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LogOut, Upload, File, Download, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileItem {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
}

export default function Dashboard() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await api.get('/files');
            setFiles(res.data);
        } catch (error) {
            console.error('Failed to fetch files', error);
            if ((error as any).response?.status === 401) {
                handleLogout();
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fetchFiles();
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            const response = await api.get(`/files/${fileId}/download`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
            alert('Download failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <File className="w-6 h-6 text-blue-500" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Secure Vault</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Actions Bar */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-semibold">Your Files</h2>
                    <div className="relative">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={isUploading}
                        />
                        <label
                            htmlFor="file-upload"
                            className={cn(
                                "flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-all shadow-lg shadow-blue-900/20",
                                isUploading
                                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-500 text-white"
                            )}
                        >
                            <Upload className="w-4 h-4" />
                            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                        </label>
                    </div>
                </div>

                {/* File List */}
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/20">
                        <div className="p-4 bg-gray-900 rounded-full mb-4">
                            <Search className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-400">No files stored yet</h3>
                        <p className="text-gray-500 text-sm mt-1">Upload your documents to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="group bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all hover:shadow-xl hover:shadow-black/20"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-gray-800 rounded-lg group-hover:bg-gray-800/80 transition-colors">
                                        <File className="w-6 h-6 text-gray-400 group-hover:text-blue-400" />
                                    </div>
                                    <button
                                        onClick={() => handleDownload(file.id, file.originalName)}
                                        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Download Decrypted"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-200 truncate mb-1" title={file.originalName}>
                                        {file.originalName}
                                    </h3>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <span>{(file.size / 1024).toFixed(2)} KB</span>
                                        <span>•</span>
                                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

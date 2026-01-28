import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { LogOut, Upload, File, Download, Search, Share2, Trash2, ShieldCheck, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import ShareDialog from '../components/ShareDialog';

interface FileItem {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: string;
    shares?: any[];
}

export default function Dashboard() {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [sharingFile, setSharingFile] = useState<{ id: string, name: string } | null>(null);
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

    const handleDelete = async (fileId: string) => {
        if (!window.confirm('Are you sure you want to delete this file? This cannot be undone.')) return;
        try {
            await api.delete(`/files/${fileId}`);
            setFiles(files.filter(f => f.id !== fileId));
        } catch (error) {
            console.error('Delete failed', error);
            alert('Delete failed');
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
                    <div className="flex items-center space-x-6">
                        <Link
                            to="/logs"
                            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Audit Logs</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm font-medium border-l border-gray-800 pl-6"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign out</span>
                        </button>
                    </div>
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
                                "flex items-center space-x-2 px-6 py-2.5 rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-900/20 font-bold",
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
                    <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                        <div className="p-6 bg-gray-900 rounded-full mb-6">
                            <Search className="w-10 h-10 text-gray-700" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-400">Your vault is empty</h3>
                        <p className="text-gray-500 text-sm mt-2">Upload your first high-security document</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-blue-900/50 transition-all hover:shadow-2xl hover:shadow-black/40 relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-5">
                                    <div className="p-3 bg-gray-800 rounded-xl group-hover:bg-blue-600/10 transition-colors">
                                        <File className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => handleDownload(file.id, file.originalName)}
                                            className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                            title="Download Decrypted"
                                        >
                                            <Download className="w-4.5 h-4.5" />
                                        </button>
                                        <button
                                            onClick={() => setSharingFile({ id: file.id, name: file.originalName })}
                                            className="p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                                            title="Share Publicly"
                                        >
                                            <Share2 className="w-4.5 h-4.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file.id)}
                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Secure Delete"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="font-bold text-gray-100 truncate text-lg" title={file.originalName}>
                                        {file.originalName}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 text-xs text-gray-500 font-medium">
                                            <span>{(file.size / 1024).toFixed(2)} KB</span>
                                            <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {file.shares && file.shares.length > 0 && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] text-purple-400 font-bold uppercase tracking-tight">
                                                <Clock className="w-3 h-3" /> Shared
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {sharingFile && (
                <ShareDialog
                    fileId={sharingFile.id}
                    fileName={sharingFile.name}
                    onClose={() => {
                        setSharingFile(null);
                        fetchFiles(); // Refresh to show "Shared" badge
                    }}
                />
            )}
        </div>
    );
}

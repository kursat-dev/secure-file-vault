import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Lock, ShieldAlert, FileText, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';

const PublicDownload: React.FC = () => {
    const { shareKey } = useParams<{ shareKey: string }>();
    const [info, setInfo] = useState<any>(null);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInfo();
    }, [shareKey]);

    const fetchInfo = async () => {
        try {
            const res = await api.get(`/sharing/info/${shareKey}`);
            setInfo(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Link not found or expired');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        setDownloading(true);
        setError(null);
        try {
            // First verify access
            await api.post(`/sharing/access/${shareKey}`, { password });

            // If verified, proceed to download
            const downloadRes = await api.get(`/sharing/download/${shareKey}?password=${encodeURIComponent(password)}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([downloadRes.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', info.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Download failed. Check your password.');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (error && !info) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
                    <div className="p-4 bg-red-400/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-slate-400 mb-8">{error}</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-primary hover:underline text-sm font-medium"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="p-4 bg-primary/10 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1 truncate px-4" title={info.originalName}>
                        {info.originalName}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {(info.size / 1024).toFixed(2)} KB • Shared via Secure Vault
                    </p>
                </div>

                <form onSubmit={handleDownload} className="space-y-6">
                    {info.hasPassword && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5 px-1">
                                <Lock className="w-3 h-3" /> This link is password protected
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="Enter password to download"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-xs text-red-400 leading-normal">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={downloading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 group"
                    >
                        {downloading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                        )}
                        Download Decrypted File
                    </button>
                </form>

                <p className="mt-8 text-[10px] text-slate-600 text-center leading-relaxed px-6">
                    Secure Vault uses AES-256-GCM encryption. Your file is decrypted locally on the server before being sent securely to you.
                </p>
            </div>
        </div>
    );
};

export default PublicDownload;

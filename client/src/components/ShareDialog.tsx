import React, { useState } from 'react';
import { Share2, Clock, Lock, Copy, Check, X, Loader2 } from 'lucide-react';
import api from '../api';

interface ShareDialogProps {
    fileId: string;
    fileName: string;
    onClose: () => void;
}

const ShareDialog: React.FC<ShareDialogProps> = ({ fileId, fileName, onClose }) => {
    const [password, setPassword] = useState('');
    const [expiresHours, setExpiresHours] = useState('24');
    const [loading, setLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCreateShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/sharing/create', {
                fileId,
                password,
                expiresHours: parseInt(expiresHours)
            });
            const url = `${window.location.origin}/share/${res.data.shareKey}`;
            setShareUrl(url);
        } catch (err) {
            console.error('Failed to create share link', err);
            alert('Failed to create share link');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (shareUrl) {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Share2 className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Share File</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-400 mb-6">
                        Sharing: <span className="text-slate-200 font-medium">{fileName}</span>
                    </p>

                    {!shareUrl ? (
                        <form onSubmit={handleCreateShare} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> Expiration
                                </label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                                    value={expiresHours}
                                    onChange={(e) => setExpiresHours(e.target.value)}
                                >
                                    <option value="1">1 Hour</option>
                                    <option value="24">24 Hours</option>
                                    <option value="168">7 Days</option>
                                    <option value="0">Never</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                                    <Lock className="w-3 h-3" /> Password Protection (Optional)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Leave empty for no password"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                                Create Shared Link
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-xs text-green-400 font-bold uppercase mb-2">Link Generated Successfully</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={shareUrl}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors border border-slate-700"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-500 text-center">
                                Anyone with the link (and password if set) can access this file until it expires.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareDialog;

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Calendar, Globe, FileText, Search } from 'lucide-react';
import api from '../api';
import { format } from 'date-fns';

interface AuditLog {
    id: string;
    action: string;
    details: string;
    ipAddress: string;
    timestamp: string;
    file?: {
        originalName: string;
    };
    user?: {
        email: string;
    };
}

const ActivityLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/audit');
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.file?.originalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getActionColor = (action: string) => {
        switch (action) {
            case 'FILE_UPLOAD': return 'text-green-400 bg-green-400/10';
            case 'FILE_DELETE': return 'text-red-400 bg-red-400/10';
            case 'FILE_DOWNLOAD': return 'text-blue-400 bg-blue-400/10';
            case 'SHARE_LINK_CREATED': return 'text-purple-400 bg-purple-400/10';
            case 'SHARE_LINK_ACCESSED': return 'text-orange-400 bg-orange-400/10';
            default: return 'text-slate-400 bg-slate-400/10';
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        Audit Trail
                    </h1>
                    <p className="text-slate-400">Monitor all security-related activities on your vault.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search activities..."
                        className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 w-full md:w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/80">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 h-16 bg-white/5"></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getActionColor(log.action)}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                                {log.details}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.file ? (
                                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {log.file.originalName}
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-mono text-slate-500">
                                                <Globe className="w-3.5 h-3.5" />
                                                {log.ipAddress || 'Unknown'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        No logs found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogs;

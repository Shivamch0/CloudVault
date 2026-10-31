import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    HardDrive,
    Shield,
    LogOut,
    CheckCircle2,
    Calendar,
    Server,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../api/apiClient";
import { formatBytes, formatDate } from "../utils/formatters";
import { useToast } from "../context/ToastContext";

export const Settings = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiClient.get("/files/stats");
                setStats(res.data.data);
            } catch {
                // Ignore silent fetch
            }
        };
        fetchStats();
    }, []);

    const handleLogout = async () => {
        await logout();
        toast.info("Logged out successfully");
        navigate("/login");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Account & Settings
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage your profile, storage usage, and security parameters
                </p>
            </div>

            {/* Profile Section */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-600/30">
                        {user?.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                        <p className="text-sm text-slate-500">{user?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Authenticated via JWT
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Full Name
                        </span>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <User className="w-4 h-4 text-slate-400" />
                            {user?.name}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Email Address
                        </span>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 truncate">
                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="truncate">{user?.email}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Member Since
                        </span>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(user?.createdAt)}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Storage Backend
                        </span>
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                            <Server className="w-4 h-4 text-blue-600" />
                            Amazon Web Services (S3)
                        </div>
                    </div>
                </div>
            </div>

            {/* Storage Quota & Limits */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Storage Usage & Limits</h3>
                        <p className="text-xs text-slate-400">
                            Configured bucket quotas and file transfer thresholds
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-800 mb-2">
                            <span>Storage Utilized</span>
                            <span className="text-blue-600 font-mono">
                                {formatBytes(stats?.totalStorageBytes || 0)} /{" "}
                                {formatBytes(stats?.storageLimitBytes || 524288000)} (
                                {stats?.usagePercentage || 0}%)
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, stats?.usagePercentage || 0)}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[11px] font-medium text-slate-400 block">Total Files</span>
                            <span className="text-base font-bold text-slate-800">{stats?.totalFiles ?? 0}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[11px] font-medium text-slate-400 block">Single File Max</span>
                            <span className="text-base font-bold text-slate-800">{stats?.maxUploadSizeMB || 10} MB</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <span className="text-[11px] font-medium text-slate-400 block">Presigned URL Validity</span>
                            <span className="text-base font-bold text-slate-800">5 minutes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Architecture Information */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Security Architecture</h3>
                        <p className="text-xs text-slate-400">
                            College AWS mini project best practices implemented
                        </p>
                    </div>
                </div>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p>
                            <span className="font-semibold text-slate-800">Private S3 Bucket:</span> Block Public Access is active. No file is ever publicly exposed.
                        </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p>
                            <span className="font-semibold text-slate-800">Direct Presigned URLs:</span> Browser uploads directly to AWS using temporary PUT credentials; AWS secrets never enter frontend code.
                        </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p>
                            <span className="font-semibold text-slate-800">User Storage Namespace:</span> File keys are isolated into <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">uploads/userId/...</code> and strictly authorized against JWT sessions.
                        </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p>
                            <span className="font-semibold text-slate-800">Cryptographic Security:</span> Passwords hashed with bcrypt salt rounds; JWT verified on every route.
                        </p>
                    </div>
                </div>
            </div>

            {/* Danger / Logout Zone */}
            <div className="bg-white rounded-3xl border border-rose-100 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900">Session Management</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Sign out of CloudVault on this computer
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-semibold text-sm transition cursor-pointer"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

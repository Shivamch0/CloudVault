import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Files,
    HardDrive,
    UploadCloud,
    Image,
    FileText,
    Film,
    Music,
    Archive,
    Folder,
    ArrowUpRight,
    TrendingUp,
} from "lucide-react";
import { apiClient } from "../api/apiClient";
import { formatBytes, formatDate } from "../utils/formatters";
import { FileIcon } from "../components/common/FileIcon";
import { FilePreviewModal } from "../components/files/FilePreviewModal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { SkeletonStats } from "../components/common/SkeletonLoader";
import { useToast } from "../context/ToastContext";

export const Dashboard = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [selectedFileForPreview, setSelectedFileForPreview] = useState(null);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get("/files/stats");
            setStats(res.data.data);
        } catch (err) {
            toast.error(err.message || "Failed to load dashboard statistics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDownload = async (file) => {
        try {
            const res = await apiClient.get(`/files/${file._id}/download-url?preview=false`);
            const url = res.data.data.downloadUrl;
            const a = document.createElement("a");
            a.href = url;
            a.download = file.originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success(`Download started for ${file.originalName}`);
        } catch (err) {
            toast.error(err.message || "Failed to generate download link");
        }
    };

    const confirmDelete = async () => {
        if (!fileToDelete) return;
        try {
            setIsDeleting(true);
            await apiClient.delete(`/files/${fileToDelete._id}`);
            toast.success("File deleted successfully from Amazon S3 and database");
            setFileToDelete(null);
            fetchStats(); // Refresh stats
        } catch (err) {
            toast.error(err.message || "Failed to delete file");
        } finally {
            setIsDeleting(false);
        }
    };

    const categoryIcons = {
        image: { icon: Image, color: "text-purple-600", bg: "bg-purple-50" },
        document: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
        video: { icon: Film, color: "text-rose-600", bg: "bg-rose-50" },
        audio: { icon: Music, color: "text-amber-600", bg: "bg-amber-50" },
        archive: { icon: Archive, color: "text-emerald-600", bg: "bg-emerald-50" },
        other: { icon: Folder, color: "text-slate-600", bg: "bg-slate-50" },
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Bar with Welcome & Upload CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                        Storage Overview
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Amazon S3 cloud bucket status & file usage metrics
                    </p>
                </div>
                <button
                    onClick={() => navigate("/upload")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/25 transition cursor-pointer"
                >
                    <UploadCloud className="w-4 h-4" />
                    Upload File
                </button>
            </div>

            {loading ? (
                <SkeletonStats />
            ) : (
                <>
                    {/* Primary Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Total Files */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Files className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> Live
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">{stats?.totalFiles ?? 0}</h3>
                            <p className="text-xs font-medium text-slate-400 mt-1">Total Uploaded Files</p>
                        </div>

                        {/* Total Used Storage */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <HardDrive className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {stats?.usagePercentage || 0}% used
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {formatBytes(stats?.totalStorageBytes || 0)}
                            </h3>
                            <p className="text-xs font-medium text-slate-400 mt-1">
                                Total Storage Used
                            </p>
                        </div>

                        {/* Storage Limit / Quota */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Folder className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-slate-400">Personal</span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {formatBytes(stats?.storageLimitBytes || 524288000)}
                            </h3>
                            <p className="text-xs font-medium text-slate-400 mt-1">Storage Quota</p>
                        </div>

                        {/* Max Upload Limit */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium text-slate-400">Per File</span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {stats?.maxUploadSizeMB || 10} MB
                            </h3>
                            <p className="text-xs font-medium text-slate-400 mt-1">Max File Upload Limit</p>
                        </div>
                    </div>

                    {/* Storage Progress Bar */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-800 mb-2">
                            <span>Storage Usage Progress</span>
                            <span className="text-blue-600">
                                {formatBytes(stats?.totalStorageBytes || 0)} of{" "}
                                {formatBytes(stats?.storageLimitBytes || 524288000)} (
                                {stats?.usagePercentage || 0}%)
                            </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, stats?.usagePercentage || 0)}%` }}
                            />
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">File Type Distribution</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {Object.entries(stats?.categoryStats || {}).map(([key, item]) => {
                                const conf = categoryIcons[key] || categoryIcons.other;
                                const Icon = conf.icon;
                                return (
                                    <Link
                                        key={key}
                                        to={`/files?category=${key}`}
                                        className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all group"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-xl ${conf.bg} ${conf.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h4 className="text-xs font-semibold text-slate-700 capitalize">
                                            {key}s
                                        </h4>
                                        <p className="text-base font-bold text-slate-900 mt-0.5">
                                            {item.count}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {formatBytes(item.size)}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Uploads Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Recent Uploads</h2>
                            <Link
                                to="/files"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                View all files <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {!stats?.recentFiles || stats.recentFiles.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                                <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                <h3 className="text-sm font-semibold text-slate-700">No files uploaded yet</h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Upload your first file to see it in your storage.
                                </p>
                                <button
                                    onClick={() => navigate("/upload")}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                                >
                                    Upload Now
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                                <div className="divide-y divide-slate-100">
                                    {stats.recentFiles.map((file) => (
                                        <div
                                            key={file._id}
                                            className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                                    <FileIcon
                                                        category={file.category}
                                                        extension={file.extension}
                                                        className="w-5 h-5"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p
                                                        onClick={() => setSelectedFileForPreview(file)}
                                                        className="text-sm font-semibold text-slate-800 truncate hover:text-blue-600 cursor-pointer"
                                                        title={file.originalName}
                                                    >
                                                        {file.originalName}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {formatBytes(file.size)} • {formatDate(file.uploadedAt)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedFileForPreview(file)}
                                                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
                                                >
                                                    Preview
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(file)}
                                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Preview Modal */}
            <FilePreviewModal
                file={selectedFileForPreview}
                isOpen={!!selectedFileForPreview}
                onClose={() => setSelectedFileForPreview(null)}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={!!fileToDelete}
                isLoading={isDeleting}
                title="Delete File"
                message={`Are you sure you want to delete "${fileToDelete?.originalName}"? This permanently removes the object from Amazon S3 and your database.`}
                confirmText="Delete File"
                onConfirm={confirmDelete}
                onClose={() => setFileToDelete(null)}
            />
        </div>
    );
};

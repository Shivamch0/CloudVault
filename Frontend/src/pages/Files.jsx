import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    LayoutGrid,
    List,
    Search,
    ArrowUpDown,
    UploadCloud,
    FolderOpen,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from "lucide-react";
import { apiClient } from "../api/apiClient";
import { FileCard } from "../components/files/FileCard";
import { FileTableRow } from "../components/files/FileTableRow";
import { FilePreviewModal } from "../components/files/FilePreviewModal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { SkeletonCard, SkeletonRow } from "../components/common/SkeletonLoader";
import { useToast } from "../context/ToastContext";

export const Files = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const toast = useToast();

    // Query state derived directly from URL parameters (avoids cascading state updates)
    const searchParam = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const sortBy = searchParams.get("sortBy") || "uploadedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const currentPage = parseInt(searchParams.get("page") || "1", 10);

    // Local search input buffer for the text field
    const [searchInput, setSearchInput] = useState(searchParam);

    // View mode: 'grid' or 'list'
    const [viewMode, setViewMode] = useState("grid");

    // Data state
    const [files, setFiles] = useState([]);
    const [pagination, setPagination] = useState({
        totalFiles: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [loading, setLoading] = useState(true);

    // Modal state
    const [selectedFileForPreview, setSelectedFileForPreview] = useState(null);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Keep searchInput in sync if URL search param changes from outside (e.g. navbar)
    useEffect(() => {
        setSearchInput(searchParam);
    }, [searchParam]);

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                search: searchParam.trim(),
                category: category !== "all" ? category : undefined,
                sortBy,
                sortOrder,
                page: currentPage,
                limit: 12,
            };

            const res = await apiClient.get("/files", { params });
            setFiles(res.data.data.files || []);
            setPagination(res.data.data.pagination || {});
        } catch (err) {
            toast.error(err.message || "Failed to load files");
        } finally {
            setLoading(false);
        }
    }, [searchParam, category, sortBy, sortOrder, currentPage, toast]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const updateFilterParams = (updates) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, val]) => {
            if (val && val !== "all") {
                newParams.set(key, val);
            } else {
                newParams.delete(key);
            }
        });
        if (!updates.page) {
            newParams.delete("page");
        }
        setSearchParams(newParams);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        updateFilterParams({ search: searchInput });
    };

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
            toast.success("File deleted successfully from Amazon S3 and MongoDB");
            setFileToDelete(null);
            fetchFiles();
        } catch (err) {
            toast.error(err.message || "Failed to delete file");
        } finally {
            setIsDeleting(false);
        }
    };

    const categories = [
        { id: "all", label: "All Files" },
        { id: "image", label: "Images" },
        { id: "document", label: "Documents" },
        { id: "video", label: "Videos" },
        { id: "audio", label: "Audio" },
        { id: "archive", label: "Archives" },
        { id: "other", label: "Others" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Upload CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                        My Cloud Files
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Browse, preview, download, and manage your private cloud documents
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchFiles}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        title="Refresh file list"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => navigate("/upload")}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/25 transition cursor-pointer"
                    >
                        <UploadCloud className="w-4 h-4" />
                        Upload
                    </button>
                </div>
            </div>

            {/* Controls Bar: Search, Category pills, Sort, and View Mode */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by filename..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-20 py-2 text-sm bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer"
                        >
                            Search
                        </button>
                    </form>

                    {/* Sorting & View Mode */}
                    <div className="flex items-center gap-3 self-end lg:self-auto">
                        {/* Sort selector */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split("-");
                                    updateFilterParams({ sortBy: field, sortOrder: order });
                                }}
                                className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
                            >
                                <option value="uploadedAt-desc">Newest First</option>
                                <option value="uploadedAt-asc">Oldest First</option>
                                <option value="originalName-asc">Name (A - Z)</option>
                                <option value="originalName-desc">Name (Z - A)</option>
                                <option value="size-desc">Size (Largest)</option>
                                <option value="size-asc">Size (Smallest)</option>
                            </select>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    viewMode === "grid"
                                        ? "bg-white text-blue-600 shadow-xs"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    viewMode === "list"
                                        ? "bg-white text-blue-600 shadow-xs"
                                        : "text-slate-500 hover:text-slate-700"
                                }`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => updateFilterParams({ category: cat.id })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                category === cat.id
                                    ? "bg-blue-600 text-white shadow-xs shadow-blue-600/30"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content: Files List / Grid / Empty / Loading */}
            {loading ? (
                viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <table className="w-full text-left">
                            <tbody>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <SkeletonRow key={i} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : files.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
                    <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-800">No files found</h3>
                    <p className="text-sm text-slate-500 mt-1">
                        {searchParam || category !== "all"
                            ? "Try adjusting your search terms or filters."
                            : "Your CloudVault bucket is empty. Upload your first file now."}
                    </p>
                    <button
                        onClick={() => navigate("/upload")}
                        className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 cursor-pointer"
                    >
                        Upload File to S3
                    </button>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {files.map((file) => (
                        <FileCard
                            key={file._id}
                            file={file}
                            onPreview={setSelectedFileForPreview}
                            onDownload={handleDownload}
                            onDelete={setFileToDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Name</th>
                                    <th className="py-3 px-4 hidden sm:table-cell">Type</th>
                                    <th className="py-3 px-4 hidden sm:table-cell">Size</th>
                                    <th className="py-3 px-4 hidden md:table-cell">Uploaded</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {files.map((file) => (
                                    <FileTableRow
                                        key={file._id}
                                        file={file}
                                        onPreview={setSelectedFileForPreview}
                                        onDownload={handleDownload}
                                        onDelete={setFileToDelete}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs text-sm text-slate-600">
                    <p className="text-xs">
                        Showing page <span className="font-semibold">{pagination.currentPage}</span> of{" "}
                        <span className="font-semibold">{pagination.totalPages}</span> ({pagination.totalFiles} files)
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => updateFilterParams({ page: currentPage - 1 })}
                            disabled={!pagination.hasPrevPage}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                        <button
                            onClick={() => updateFilterParams({ page: currentPage + 1 })}
                            disabled={!pagination.hasNextPage}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium cursor-pointer"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
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
                message={`Are you sure you want to delete "${fileToDelete?.originalName}"? This action will permanently remove the file from your Amazon S3 bucket.`}
                confirmText="Delete File"
                onConfirm={confirmDelete}
                onClose={() => setFileToDelete(null)}
            />
        </div>
    );
};

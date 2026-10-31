import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    UploadCloud,
    File as FileIconLucide,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowRight,
    ShieldCheck,
} from "lucide-react";
import { apiClient, uploadFileToS3 } from "../api/apiClient";
import { formatBytes } from "../utils/formatters";
import { useToast } from "../context/ToastContext";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const Upload = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const fileInputRef = useRef(null);

    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndAddFiles = (newFiles) => {
        const validList = [];
        for (let i = 0; i < newFiles.length; i++) {
            const file = newFiles[i];

            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast.error(
                    `"${file.name}" exceeds the maximum upload limit of ${MAX_FILE_SIZE_MB} MB.`
                );
                continue;
            }

            validList.push({
                file,
                id: `${Date.now()}-${Math.random()}`,
                name: file.name,
                size: file.size,
                type: file.type || "application/octet-stream",
                progress: 0,
                status: "idle", // 'idle' | 'uploading' | 'completed' | 'error'
                errorMessage: "",
                cancelSource: null,
            });
        }

        setSelectedFiles((prev) => [...prev, ...validList]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndAddFiles(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndAddFiles(e.target.files);
        }
    };

    const removeFile = (id) => {
        const target = selectedFiles.find((f) => f.id === id);
        if (target && target.status === "uploading" && target.cancelSource) {
            target.cancelSource.cancel("Upload cancelled by user");
        }
        setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleCancelAll = () => {
        selectedFiles.forEach((item) => {
            if (item.status === "uploading" && item.cancelSource) {
                item.cancelSource.cancel("Upload cancelled by user");
            }
        });
        setUploading(false);
        setSelectedFiles((prev) =>
            prev.map((f) => (f.status === "uploading" ? { ...f, status: "error", errorMessage: "Cancelled" } : f))
        );
    };

    // Upload one item through the Presigned URL Flow
    const uploadSingleFile = async (item) => {
        const cancelSource = axios.CancelToken.source();

        setSelectedFiles((prev) =>
            prev.map((f) =>
                f.id === item.id
                    ? { ...f, status: "uploading", progress: 5, cancelSource }
                    : f
            )
        );

        try {
            // Step 1: Request presigned S3 PUT URL from Express backend
            const urlRes = await apiClient.post("/files/upload-url", {
                fileName: item.name,
                mimeType: item.type,
                size: item.size,
            });

            const { uploadUrl, objectKey } = urlRes.data.data;

            // Step 2: Direct browser-to-S3 upload using isolated request
            await uploadFileToS3(
                uploadUrl,
                item.file,
                (progress) => {
                    setSelectedFiles((prev) =>
                        prev.map((f) => (f.id === item.id ? { ...f, progress } : f))
                    );
                },
                cancelSource
            );

            // Step 3: Confirm upload with Express backend to verify S3 object and persist metadata
            await apiClient.post("/files/confirm-upload", {
                objectKey,
                originalName: item.name,
                mimeType: item.type,
                size: item.size,
            });

            setSelectedFiles((prev) =>
                prev.map((f) =>
                    f.id === item.id
                        ? { ...f, status: "completed", progress: 100 }
                        : f
                )
            );
            return true;
        } catch (err) {
            if (axios.isCancel(err)) {
                setSelectedFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id
                            ? { ...f, status: "error", errorMessage: "Upload cancelled" }
                            : f
                    )
                );
            } else {
                const message = err.response?.data?.message || err.message || "Upload failed";
                setSelectedFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id
                            ? { ...f, status: "error", errorMessage: message }
                            : f
                    )
                );
            }
            return false;
        }
    };

    const handleUploadAll = async () => {
        const pendingFiles = selectedFiles.filter((f) => f.status === "idle" || f.status === "error");
        if (pendingFiles.length === 0) return;

        setUploading(true);
        let successCount = 0;

        for (const item of pendingFiles) {
            const success = await uploadSingleFile(item);
            if (success) successCount++;
        }

        setUploading(false);
        if (successCount > 0) {
            toast.success(`Successfully uploaded ${successCount} file(s) to Amazon S3!`);
        }
    };

    const allCompleted =
        selectedFiles.length > 0 && selectedFiles.every((f) => f.status === "completed");

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Upload to Amazon S3
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Direct browser-to-S3 presigned upload with end-to-end authorization
                </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                    dragActive
                        ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                        : "border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50 shadow-xs"
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4 shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                </div>

                <h3 className="text-base font-bold text-slate-800">
                    Click to select files or drag & drop here
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
                    Supports any file type (images, documents, PDFs, videos, zip archives) up to{" "}
                    <span className="font-semibold text-slate-700">{MAX_FILE_SIZE_MB} MB</span> per file.
                </p>

                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[11px] font-medium text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Private S3 Bucket • Presigned PUT URLs
                </div>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Selected Files ({selectedFiles.length})
                            </h3>
                            <p className="text-xs text-slate-400">
                                Total size:{" "}
                                {formatBytes(selectedFiles.reduce((acc, curr) => acc + curr.size, 0))}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {uploading ? (
                                <button
                                    onClick={handleCancelAll}
                                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                            ) : (
                                <button
                                    onClick={() => setSelectedFiles([])}
                                    className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Clear List
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                        {selectedFiles.map((item) => (
                            <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                        <FileIconLucide className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-800 truncate" title={item.name}>
                                            {item.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{formatBytes(item.size)}</span>
                                            {item.errorMessage && (
                                                <span className="text-rose-600 font-medium truncate">
                                                    • {item.errorMessage}
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress bar during upload */}
                                        {item.status === "uploading" && (
                                            <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-200"
                                                    style={{ width: `${item.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                                    {item.status === "uploading" && (
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{item.progress}%</span>
                                        </div>
                                    )}

                                    {item.status === "completed" && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                        </span>
                                    )}

                                    {item.status === "error" && (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                                            <AlertCircle className="w-3.5 h-3.5" /> Failed
                                        </span>
                                    )}

                                    <button
                                        onClick={() => removeFile(item.id)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                        title="Remove file"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        {allCompleted ? (
                            <button
                                onClick={() => navigate("/files")}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/30 transition cursor-pointer"
                            >
                                View Uploaded Files <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleUploadAll}
                                disabled={uploading || selectedFiles.length === 0}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/30 transition cursor-pointer disabled:opacity-50"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading to Amazon S3...
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-4 h-4" />
                                        Start Upload ({selectedFiles.filter((f) => f.status === "idle").length})
                                    </>
                                )}
                            </button>
                        )}

                        <span className="text-xs text-slate-400 text-center sm:text-right">
                            Files are transferred directly to S3 via encrypted HTTPS
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

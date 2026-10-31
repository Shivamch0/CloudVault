import { useEffect, useState } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { apiClient } from "../../api/apiClient";
import { formatBytes, formatDate } from "../../utils/formatters";
import { FileIcon } from "../common/FileIcon";

export const FilePreviewModal = ({ file, isOpen, onClose }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !file) {
            setPreviewUrl(null);
            setDownloadUrl(null);
            setError(null);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        const fetchUrls = async () => {
            try {
                // Fetch presigned URL with inline disposition for preview
                const previewRes = await apiClient.get(`/files/${file._id}/download-url?preview=true`);
                // Fetch presigned URL with attachment disposition for download
                const downloadRes = await apiClient.get(`/files/${file._id}/download-url?preview=false`);

                if (isMounted) {
                    setPreviewUrl(previewRes.data.data.downloadUrl);
                    setDownloadUrl(downloadRes.data.data.downloadUrl);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message || "Failed to load secure preview URL");
                    setLoading(false);
                }
            }
        };

        fetchUrls();

        return () => {
            isMounted = false;
        };
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const isImage = file.category === "image";
    const isPdf = file.mimeType === "application/pdf" || file.extension === "pdf";
    const isAudio = file.category === "audio";
    const isVideo = file.category === "video";

    const canPreview = isImage || isPdf || isAudio || isVideo;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon category={file.category} extension={file.extension} className="w-5 h-5 shrink-0" />
                        <div className="truncate">
                            <h3 className="text-base font-semibold text-slate-800 truncate" title={file.originalName}>
                                {file.originalName}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {formatBytes(file.size)} • {formatDate(file.uploadedAt)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {downloadUrl && (
                            <a
                                href={downloadUrl}
                                download={file.originalName}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-slate-100/50 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3 py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <p className="text-sm font-medium text-slate-500">Generating secure preview...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 px-4 max-w-md">
                            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
                                <X className="w-6 h-6" />
                            </div>
                            <h4 className="text-base font-semibold text-slate-800">Preview Unavailable</h4>
                            <p className="mt-1 text-sm text-slate-500">{error}</p>
                            {downloadUrl && (
                                <a
                                    href={downloadUrl}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
                                >
                                    <Download className="w-4 h-4" /> Download File Instead
                                </a>
                            )}
                        </div>
                    ) : canPreview ? (
                        <div className="w-full h-full flex items-center justify-center">
                            {isImage && (
                                <img
                                    src={previewUrl}
                                    alt={file.originalName}
                                    className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-xs bg-white"
                                />
                            )}
                            {isPdf && (
                                <iframe
                                    src={`${previewUrl}#toolbar=1`}
                                    title={file.originalName}
                                    className="w-full h-[65vh] rounded-xl border border-slate-200 bg-white"
                                />
                            )}
                            {isVideo && (
                                <video
                                    src={previewUrl}
                                    controls
                                    className="max-h-[65vh] max-w-full rounded-xl shadow-xs"
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            {isAudio && (
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center w-full max-w-md">
                                    <FileIcon category="audio" className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                                    <p className="font-semibold text-slate-800 mb-4">{file.originalName}</p>
                                    <audio src={previewUrl} controls className="w-full">
                                        Your browser does not support audio playback.
                                    </audio>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
                                <FileIcon category={file.category} extension={file.extension} className="w-8 h-8" />
                            </div>
                            <h4 className="text-lg font-semibold text-slate-800 mb-1">{file.originalName}</h4>
                            <p className="text-sm text-slate-500 mb-6">
                                Direct inline preview is not supported for this file type ({file.mimeType}). You can download it to view locally.
                            </p>
                            <div className="bg-slate-50 rounded-xl p-3 text-left text-xs space-y-1.5 text-slate-600 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">File Type:</span>
                                    <span className="font-medium uppercase">{file.extension || "Unknown"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">MIME:</span>
                                    <span className="font-mono">{file.mimeType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Size:</span>
                                    <span className="font-medium">{formatBytes(file.size)}</span>
                                </div>
                            </div>
                            {downloadUrl && (
                                <a
                                    href={downloadUrl}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-600/20"
                                >
                                    <Download className="w-4 h-4" /> Download File
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-400">
                    <span>Stored securely in Amazon S3 private bucket</span>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

import { Download, Trash2, Eye } from "lucide-react";
import { formatBytes, formatDate, getCategoryBadgeStyle } from "../../utils/formatters";
import { FileIcon } from "../common/FileIcon";

export const FileCard = ({ file, onPreview, onDownload, onDelete }) => {
    return (
        <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between">
            <div>
                {/* Header with Icon and Category */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileIcon category={file.category} extension={file.extension} className="w-6 h-6" />
                    </div>
                    <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryBadgeStyle(
                            file.category
                        )}`}
                    >
                        {file.category}
                    </span>
                </div>

                {/* Filename */}
                <h4
                    className="font-semibold text-slate-800 text-sm truncate mb-1"
                    title={file.originalName}
                >
                    {file.originalName}
                </h4>

                {/* Meta */}
                <div className="flex items-center text-xs text-slate-400 gap-2 mb-4">
                    <span>{formatBytes(file.size)}</span>
                    <span>•</span>
                    <span className="truncate">{formatDate(file.uploadedAt)}</span>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                <button
                    onClick={() => onPreview(file)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition cursor-pointer"
                    title="Preview file"
                >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                </button>

                <button
                    onClick={() => onDownload(file)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="Download file"
                >
                    <Download className="w-4 h-4" />
                </button>

                <button
                    onClick={() => onDelete(file)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete file"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

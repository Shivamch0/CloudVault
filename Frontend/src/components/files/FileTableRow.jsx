import { Download, Trash2, Eye } from "lucide-react";
import { formatBytes, formatDate, getCategoryBadgeStyle } from "../../utils/formatters";
import { FileIcon } from "../common/FileIcon";

export const FileTableRow = ({ file, onPreview, onDownload, onDelete }) => {
    return (
        <tr className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
            <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <FileIcon category={file.category} extension={file.extension} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 max-w-xs sm:max-w-md">
                        <button
                            onClick={() => onPreview(file)}
                            className="text-left font-medium text-slate-800 text-sm hover:text-blue-600 truncate block w-full cursor-pointer"
                            title={file.originalName}
                        >
                            {file.originalName}
                        </button>
                        <span className="text-xs text-slate-400 font-mono sm:hidden">
                            {formatBytes(file.size)}
                        </span>
                    </div>
                </div>
            </td>

            <td className="py-3 px-4 hidden sm:table-cell">
                <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryBadgeStyle(
                        file.category
                    )}`}
                >
                    {file.category}
                </span>
            </td>

            <td className="py-3 px-4 text-xs text-slate-500 font-mono hidden sm:table-cell whitespace-nowrap">
                {formatBytes(file.size)}
            </td>

            <td className="py-3 px-4 text-xs text-slate-400 hidden md:table-cell whitespace-nowrap">
                {formatDate(file.uploadedAt)}
            </td>

            <td className="py-3 px-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => onPreview(file)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Preview"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDownload(file)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Download"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(file)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
};

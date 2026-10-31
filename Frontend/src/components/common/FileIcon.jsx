import {
    FileImage,
    FileText,
    FileVideo,
    FileAudio,
    FileArchive,
    FileCode,
    FileSpreadsheet,
    File,
} from "lucide-react";

export const FileIcon = ({ category = "other", extension = "", className = "w-6 h-6" }) => {
    const ext = (extension || "").toLowerCase();

    if (category === "image") {
        return <FileImage className={`${className} text-purple-500`} />;
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
        return <FileSpreadsheet className={`${className} text-emerald-600`} />;
    }
    if (["js", "ts", "jsx", "tsx", "html", "css", "py", "json"].includes(ext)) {
        return <FileCode className={`${className} text-amber-500`} />;
    }
    if (category === "document" || ext === "pdf") {
        return <FileText className={`${className} text-blue-500`} />;
    }
    if (category === "video") {
        return <FileVideo className={`${className} text-rose-500`} />;
    }
    if (category === "audio") {
        return <FileAudio className={`${className} text-amber-500`} />;
    }
    if (category === "archive") {
        return <FileArchive className={`${className} text-emerald-500`} />;
    }

    return <File className={`${className} text-slate-400`} />;
};

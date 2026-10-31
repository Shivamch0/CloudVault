import path from "path";

export const getFileExtension = (filename = "") => {
    const ext = path.extname(filename).toLowerCase().replace(".", "");
    return ext || "unknown";
};

export const sanitizeFileName = (filename = "") => {
    // Remove directory traversal characters, trim, and replace special chars
    const base = path.basename(filename).trim();
    return base.replace(/[^a-zA-Z0-9._-]/g, "_");
};

export const categorizeMimeType = (mimeType = "", extension = "") => {
    const mime = (mimeType || "").toLowerCase();
    const ext = (extension || "").toLowerCase();

    if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) {
        return "image";
    }
    if (
        mime === "application/pdf" ||
        mime.includes("word") ||
        mime.includes("document") ||
        mime.includes("sheet") ||
        mime.includes("presentation") ||
        mime.startsWith("text/") ||
        ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "md"].includes(ext)
    ) {
        return "document";
    }
    if (mime.startsWith("video/") || ["mp4", "webm", "mkv", "mov", "avi"].includes(ext)) {
        return "video";
    }
    if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(ext)) {
        return "audio";
    }
    if (
        mime.includes("zip") ||
        mime.includes("compressed") ||
        mime.includes("tar") ||
        mime.includes("rar") ||
        mime.includes("7z") ||
        ["zip", "rar", "7z", "tar", "gz"].includes(ext)
    ) {
        return "archive";
    }
    return "other";
};

export const formatBytes = (bytes = 0, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};


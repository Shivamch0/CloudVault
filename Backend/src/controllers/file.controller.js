import mongoose from "mongoose";
import crypto from "crypto";
import { File } from "../models/file.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    getPresignedUploadUrl,
    getPresignedDownloadUrl,
    checkObjectExists,
    deleteS3Object,
    S3_BUCKET_NAME,
} from "../config/s3.js";
import {
    sanitizeFileName,
    getFileExtension,
    categorizeMimeType,
} from "../utils/fileHelpers.js";

const MAX_UPLOAD_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "10", 10);
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
// Configurable storage quota per user (default 500 MB)
const USER_STORAGE_QUOTA_MB = parseInt(process.env.USER_STORAGE_QUOTA_MB || "500", 10);
const USER_STORAGE_QUOTA_BYTES = USER_STORAGE_QUOTA_MB * 1024 * 1024;

/**
 * 1. Generate Presigned Upload URL
 */
export const getUploadUrl = asyncHandler(async (req, res) => {
    const { fileName, mimeType, size } = req.body;

    if (!fileName || !mimeType) {
        throw new ApiError(400, "fileName and mimeType are required");
    }

    const fileSize = parseInt(size, 10);
    if (isNaN(fileSize) || fileSize <= 0) {
        throw new ApiError(400, "A valid positive file size is required");
    }

    if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
        throw new ApiError(
            400,
            `File size exceeds maximum upload limit of ${MAX_UPLOAD_SIZE_MB} MB`
        );
    }

    // Check user's current total storage usage against quota
    const currentUsageResult = await File.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: null, totalBytes: { $sum: "$size" } } },
    ]);
    const currentUsedBytes = currentUsageResult[0]?.totalBytes || 0;

    if (currentUsedBytes + fileSize > USER_STORAGE_QUOTA_BYTES) {
        throw new ApiError(
            400,
            `Storage quota exceeded. You have used ${(currentUsedBytes / (1024 * 1024)).toFixed(
                1
            )} MB of ${USER_STORAGE_QUOTA_MB} MB limit.`
        );
    }

    const sanitized = sanitizeFileName(fileName);
    const uniqueId = crypto.randomUUID().slice(0, 8);
    // User-namespaced object key
    const objectKey = `uploads/${req.user._id}/${Date.now()}-${uniqueId}-${sanitized}`;

    const uploadUrl = await getPresignedUploadUrl(objectKey, mimeType);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                uploadUrl,
                objectKey,
                bucket: S3_BUCKET_NAME,
                maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
                expiresInSeconds: parseInt(process.env.PRESIGNED_URL_EXPIRY_SECONDS || "300", 10),
            },
            "Presigned upload URL generated successfully"
        )
    );
});

/**
 * 2. Confirm Upload & Save Metadata in MongoDB
 */
export const confirmUpload = asyncHandler(async (req, res) => {
    const { objectKey, originalName, mimeType, size } = req.body;

    if (!objectKey || !originalName || !mimeType) {
        throw new ApiError(400, "objectKey, originalName, and mimeType are required");
    }

    // Security check: Must belong to authenticated user namespace
    const expectedPrefix = `uploads/${req.user._id}/`;
    if (!objectKey.startsWith(expectedPrefix)) {
        throw new ApiError(403, "Forbidden: Invalid object key namespace for current user");
    }

    // Verify S3 object actually exists before saving metadata
    let s3Metadata;
    try {
        s3Metadata = await checkObjectExists(objectKey);
    } catch (err) {
        throw new ApiError(
            500,
            `Failed to verify object in storage: ${err.message || "AWS S3 error"}`
        );
    }

    if (!s3Metadata || !s3Metadata.exists) {
        throw new ApiError(
            404,
            "Uploaded file was not found in S3 bucket. Upload may have failed or expired."
        );
    }

    const verifiedSize = s3Metadata.size ?? parseInt(size, 10);
    const verifiedMimeType = s3Metadata.mimeType || mimeType;
    const extension = getFileExtension(originalName);
    const category = categorizeMimeType(verifiedMimeType, extension);

    // Save metadata in MongoDB
    const fileRecord = await File.create({
        user: req.user._id,
        originalName: sanitizeFileName(originalName),
        objectKey,
        mimeType: verifiedMimeType,
        size: verifiedSize,
        extension,
        category,
        uploadedAt: new Date(),
    });

    return res
        .status(201)
        .json(new ApiResponse(201, fileRecord, "File upload confirmed and recorded"));
});

/**
 * 3. List User Files (with Search, Filter, Sort, Pagination)
 */
export const getUserFiles = asyncHandler(async (req, res) => {
    const {
        search = "",
        category = "all",
        sortBy = "uploadedAt",
        sortOrder = "desc",
        page = 1,
        limit = 12,
    } = req.query;

    const query = { user: req.user._id };

    if (search.trim()) {
        query.originalName = { $regex: search.trim(), $options: "i" };
    }

    if (category && category !== "all") {
        query.category = category;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const allowedSortFields = ["uploadedAt", "originalName", "size"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "uploadedAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sortOptions = { [sortField]: sortDirection };

    const [files, totalFiles] = await Promise.all([
        File.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
        File.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalFiles / limitNum) || 1;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                files,
                pagination: {
                    totalFiles,
                    totalPages,
                    currentPage: pageNum,
                    limit: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1,
                },
            },
            "Files retrieved successfully"
        )
    );
});

/**
 * 4. Get File Metadata by ID
 */
export const getFileById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid file ID format");
    }

    const file = await File.findOne({ _id: id, user: req.user._id });

    if (!file) {
        throw new ApiError(404, "File not found or unauthorized access");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, file, "File metadata retrieved"));
});

/**
 * 5. Get Presigned Download / Preview URL
 */
export const getDownloadUrl = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isPreview = req.query.preview === "true";

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid file ID format");
    }

    const file = await File.findOne({ _id: id, user: req.user._id });

    if (!file) {
        throw new ApiError(404, "File not found or unauthorized access");
    }

    const downloadUrl = await getPresignedDownloadUrl(
        file.objectKey,
        file.originalName,
        isPreview,
        file.mimeType
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                downloadUrl,
                fileName: file.originalName,
                mimeType: file.mimeType,
                size: file.size,
                isPreview,
                expiresInSeconds: parseInt(process.env.PRESIGNED_URL_EXPIRY_SECONDS || "300", 10),
            },
            "Temporary file URL generated successfully"
        )
    );
});

/**
 * 6. Delete File (S3 Object + MongoDB Record)
 */
export const deleteFile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Invalid file ID format");
    }

    const file = await File.findOne({ _id: id, user: req.user._id });

    if (!file) {
        throw new ApiError(404, "File not found or unauthorized access");
    }

    // Attempt to delete from S3 first
    try {
        await deleteS3Object(file.objectKey);
    } catch (err) {
        // If S3 deletion fails with non-404 error, abort to prevent orphaned data
        if (err.name !== "NotFound" && err.$metadata?.httpStatusCode !== 404) {
            throw new ApiError(
                502,
                `Failed to delete file from S3: ${err.message}. Database record preserved.`
            );
        }
    }

    // Now safely delete MongoDB metadata
    await File.findByIdAndDelete(file._id);

    return res
        .status(200)
        .json(new ApiResponse(200, { fileId: id }, "File deleted successfully"));
});

/**
 * 7. Storage Statistics & Dashboard Metrics
 */
export const getStorageStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [aggregations, recentFiles] = await Promise.all([
        File.aggregate([
            { $match: { user: userId } },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    totalSize: { $sum: "$size" },
                },
            },
        ]),
        File.find({ user: userId })
            .sort({ uploadedAt: -1 })
            .limit(5)
            .lean(),
    ]);

    let totalFiles = 0;
    let totalStorageBytes = 0;
    const categoryStats = {
        image: { count: 0, size: 0 },
        document: { count: 0, size: 0 },
        video: { count: 0, size: 0 },
        audio: { count: 0, size: 0 },
        archive: { count: 0, size: 0 },
        other: { count: 0, size: 0 },
    };

    aggregations.forEach((item) => {
        totalFiles += item.count;
        totalStorageBytes += item.totalSize;
        if (categoryStats[item._id]) {
            categoryStats[item._id] = {
                count: item.count,
                size: item.totalSize,
            };
        } else {
            categoryStats.other.count += item.count;
            categoryStats.other.size += item.totalSize;
        }
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalFiles,
                totalStorageBytes,
                storageLimitBytes: USER_STORAGE_QUOTA_BYTES,
                usagePercentage: Math.min(
                    100,
                    parseFloat(((totalStorageBytes / USER_STORAGE_QUOTA_BYTES) * 100).toFixed(2))
                ),
                maxUploadSizeMB: MAX_UPLOAD_SIZE_MB,
                categoryStats,
                recentFiles,
            },
            "Storage statistics retrieved"
        )
    );
});


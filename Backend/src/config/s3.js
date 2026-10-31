import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-1";
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "cloudvault-storage";
export const PRESIGNED_URL_EXPIRY_SECONDS = parseInt(
    process.env.PRESIGNED_URL_EXPIRY_SECONDS || "300",
    10
);

// S3 Client configuration
// If AWS_ACCESS_KEY_ID is explicitly set, use explicit credentials.
// Otherwise, the default credential provider chain (AWS CLI ~/.aws/credentials, IAM role, ECS task role) will be used.
const clientConfig = {
    region,
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
    if (process.env.AWS_SESSION_TOKEN) {
        clientConfig.credentials.sessionToken = process.env.AWS_SESSION_TOKEN;
    }
}

export const s3Client = new S3Client(clientConfig);

/**
 * Generate a presigned PUT URL for uploading directly from browser to S3
 */
export const getPresignedUploadUrl = async (objectKey, mimeType, expiresIn = PRESIGNED_URL_EXPIRY_SECONDS) => {
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: objectKey,
        ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return uploadUrl;
};

/**
 * Generate a presigned GET URL for downloading or previewing
 * @param {string} objectKey
 * @param {string} originalName
 * @param {boolean} isPreview - if true, sets inline disposition; if false, attachment
 * @param {string} mimeType
 * @param {number} expiresIn
 */
export const getPresignedDownloadUrl = async (
    objectKey,
    originalName,
    isPreview = false,
    mimeType = "application/octet-stream",
    expiresIn = PRESIGNED_URL_EXPIRY_SECONDS
) => {
    const encodedFileName = encodeURIComponent(originalName || "download");
    const contentDisposition = isPreview
        ? `inline; filename="${encodedFileName}"`
        : `attachment; filename="${encodedFileName}"`;

    const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: objectKey,
        ResponseContentDisposition: contentDisposition,
        ResponseContentType: mimeType,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return downloadUrl;
};

/**
 * Check if an object exists in S3 and retrieve its metadata
 */
export const checkObjectExists = async (objectKey) => {
    try {
        const command = new HeadObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: objectKey,
        });
        const response = await s3Client.send(command);
        return {
            exists: true,
            size: response.ContentLength,
            mimeType: response.ContentType,
            lastModified: response.LastModified,
        };
    } catch (error) {
        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
            return { exists: false };
        }
        throw error;
    }
};

/**
 * Delete an object from S3
 */
export const deleteS3Object = async (objectKey) => {
    const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: objectKey,
    });
    return await s3Client.send(command);
};


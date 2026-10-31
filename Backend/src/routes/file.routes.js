import { Router } from "express";
import {
    getUploadUrl,
    confirmUpload,
    getUserFiles,
    getFileById,
    getDownloadUrl,
    deleteFile,
    getStorageStats,
} from "../controllers/file.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all file routes with JWT authentication
router.use(verifyJWT);

// Stats route (placed before parameterized :id route)
router.get("/stats", getStorageStats);

// Upload routes
router.post("/upload-url", getUploadUrl);
router.post("/confirm-upload", confirmUpload);

// List files with search, filtering, pagination
router.get("/", getUserFiles);

// Individual file operations
router.get("/:id", getFileById);
router.get("/:id/download-url", getDownloadUrl);
router.delete("/:id", deleteFile);

export default router;


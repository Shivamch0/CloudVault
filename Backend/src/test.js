import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import assert from "assert";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
    getFileExtension,
    sanitizeFileName,
    categorizeMimeType,
    formatBytes,
} from "./utils/fileHelpers.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import app from "./app.js";

async function runTests() {
    console.log("=========================================");
    console.log("  Running CloudVault Backend Unit Tests  ");
    console.log("=========================================");

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✓ ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ ${name}`);
            console.error(`    Error: ${err.message}`);
            failed++;
        }
    }

    async function asyncTest(name, fn) {
        try {
            await fn();
            console.log(`  ✓ ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ ${name}`);
            console.error(`    Error: ${err.message}`);
            failed++;
        }
    }

    // 1. File Helpers
    console.log("\n[1] Testing File Helpers...");
    test("getFileExtension extracts lowercase extension", () => {
        assert.strictEqual(getFileExtension("photo.JPEG"), "jpeg");
        assert.strictEqual(getFileExtension("archive.tar.gz"), "gz");
        assert.strictEqual(getFileExtension("README"), "unknown");
    });

    test("sanitizeFileName strips path traversal and invalid characters", () => {
        assert.strictEqual(
            sanitizeFileName("../../etc/passwd"),
            "passwd"
        );
        assert.strictEqual(
            sanitizeFileName("my cool file (1) [final].pdf"),
            "my_cool_file__1___final_.pdf"
        );
    });

    test("categorizeMimeType categorizes file types correctly", () => {
        assert.strictEqual(categorizeMimeType("image/png", "png"), "image");
        assert.strictEqual(categorizeMimeType("application/pdf", "pdf"), "document");
        assert.strictEqual(categorizeMimeType("video/mp4", "mp4"), "video");
        assert.strictEqual(categorizeMimeType("audio/mpeg", "mp3"), "audio");
        assert.strictEqual(categorizeMimeType("application/zip", "zip"), "archive");
        assert.strictEqual(categorizeMimeType("application/octet-stream", "bin"), "other");
    });

    test("formatBytes formats byte sizes accurately", () => {
        assert.strictEqual(formatBytes(0), "0 Bytes");
        assert.strictEqual(formatBytes(1024), "1 KB");
        assert.strictEqual(formatBytes(1048576), "1 MB");
        assert.strictEqual(formatBytes(1073741824), "1 GB");
    });

    // 2. JWT & User Password Logic
    console.log("\n[2] Testing Authentication & Token Logic...");
    await asyncTest("Password hashing and comparison with bcrypt", async () => {
        const plainPassword = "SuperSecurePassword123!";
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plainPassword, salt);
        const match = await bcrypt.compare(plainPassword, hash);
        assert.strictEqual(match, true);
        const mismatch = await bcrypt.compare("WrongPassword", hash);
        assert.strictEqual(mismatch, false);
    });

    test("JWT generation and verification", () => {
        const secret = process.env.JWT_SECRET || "cloudvault_test_secret";
        const payload = {
            _id: new mongoose.Types.ObjectId().toString(),
            email: "student@college.edu",
            name: "College Student",
        };
        const token = jwt.sign(payload, secret, { expiresIn: "1h" });
        const decoded = jwt.verify(token, secret);
        assert.strictEqual(decoded.email, payload.email);
        assert.strictEqual(decoded.name, payload.name);
        assert.strictEqual(decoded._id, payload._id);
    });

    // 3. AWS S3 Presigned URL Generation
    console.log("\n[3] Testing AWS S3 Presigned URL Generation...");
    const testS3Client = new S3Client({
        region: process.env.AWS_REGION || "us-east-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || "MOCK_AKIA_TEST_KEY_ID",
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "MOCK_SECRET_ACCESS_KEY_1234567890",
        },
    });

    await asyncTest("Generates valid presigned upload PUT URL with HMAC signature", async () => {
        const command = new PutObjectCommand({
            Bucket: "test-cloudvault-bucket",
            Key: "uploads/test-user-id/123456-test.png",
            ContentType: "image/png",
        });
        const url = await getSignedUrl(testS3Client, command, { expiresIn: 300 });
        assert.ok(url.includes("test-cloudvault-bucket"), "URL must contain bucket name");
        assert.ok(url.includes("X-Amz-Algorithm=AWS4-HMAC-SHA256"), "URL must have AWS4-HMAC-SHA256 algorithm");
        assert.ok(url.includes("X-Amz-Signature="), "URL must contain AWS presigned signature");
        assert.ok(url.includes("X-Amz-Expires=300"), "URL must reflect expiry seconds");
    });

    await asyncTest("Generates valid presigned download GET URL with inline preview", async () => {
        const command = new GetObjectCommand({
            Bucket: "test-cloudvault-bucket",
            Key: "uploads/test-user-id/document.pdf",
            ResponseContentDisposition: 'inline; filename="document.pdf"',
            ResponseContentType: "application/pdf",
        });
        const url = await getSignedUrl(testS3Client, command, { expiresIn: 300 });
        assert.ok(url.includes("response-content-disposition=inline"), "Preview URL must set inline disposition");
        assert.ok(url.includes("X-Amz-Signature="), "Preview URL must contain signature");
    });

    await asyncTest("Generates valid presigned download GET URL with attachment disposition", async () => {
        const command = new GetObjectCommand({
            Bucket: "test-cloudvault-bucket",
            Key: "uploads/test-user-id/document.pdf",
            ResponseContentDisposition: 'attachment; filename="document.pdf"',
            ResponseContentType: "application/pdf",
        });
        const url = await getSignedUrl(testS3Client, command, { expiresIn: 300 });
        assert.ok(url.includes("response-content-disposition=attachment"), "Download URL must set attachment disposition");
    });

    // 4. Express App Structure
    console.log("\n[4] Testing Express App Configuration...");
    test("Express app is a valid request listener function", () => {
        assert.strictEqual(typeof app, "function", "Express app must be a callable request handler");
    });

    console.log("\n=========================================");
    console.log(`  Tests Completed: ${passed} Passed, ${failed} Failed`);
    console.log("=========================================\n");

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
});

import mongoose, { Schema } from "mongoose";

const fileSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        originalName: {
            type: String,
            required: true,
            trim: true,
        },
        objectKey: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
            min: 0,
        },
        extension: {
            type: String,
            default: "",
        },
        category: {
            type: String,
            enum: ["image", "document", "video", "audio", "archive", "other"],
            default: "other",
            index: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient user-scoped queries and sorting
fileSchema.index({ user: 1, uploadedAt: -1 });
fileSchema.index({ user: 1, category: 1 });
fileSchema.index({ user: 1, originalName: 1 });

export const File = mongoose.model("File", fileSchema);


import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

export const connectDB = async () => {
    try {
        const rawUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
        if (!rawUrl) {
            console.warn("MongoDB warning: MONGO_URL or MONGODB_URI is not set.");
            return;
        }

        let uri = rawUrl.trim();
        if (!uri.includes(DB_NAME)) {
            if (uri.includes("?")) {
                const [base, query] = uri.split("?");
                uri = `${base.replace(/\/+$/, "")}/${DB_NAME}?${query}`;
            } else {
                uri = `${uri.replace(/\/+$/, "")}/${DB_NAME}`;
            }
        }

        const con = await mongoose.connect(uri);
        console.log("Database connected successfully:", con.connection.host);
    } catch (error) {
        console.log("Something went wrong while connecting the database:", error.message);
    }
};

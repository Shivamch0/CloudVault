import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import dns from 'dns';

dns.setServers(['1.1.1.1' , '8.8.8.8']);

export const connectDB = async () => {
    try {
        const con = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
        console.log("Database connected successfully...")
    } catch (error) {
        console.log("Something went wrong while connecting the database" ,error)
    }
}
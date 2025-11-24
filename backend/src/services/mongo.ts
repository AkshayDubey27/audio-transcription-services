import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectMongo = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/transcriptions";
  await mongoose.connect(uri);
  console.log("MongoDB connected");
};

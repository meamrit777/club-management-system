import mongoose from "mongoose";

import { getEnvConfig } from "./env.config.js";

export const connectDB = async () => {
  try {
    const { MODE, MONGO_CONNECTION_URI } = getEnvConfig();

    if (!MONGO_CONNECTION_URI) throw new Error("Invalid MongoDB Connection Url!");

    const conn = await mongoose.connect(MONGO_CONNECTION_URI);

    console.log(`[${MODE.toUpperCase()} ENV] MongoDB Connected 🟢 : ${conn?.connection?.host}`);
  } catch (error) {
    console.error(`MongoDB Error 🔴 : ${error.message}`);
    process.exit(1);
  }
};

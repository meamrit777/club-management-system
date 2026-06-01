import dotenv from "dotenv";

dotenv.config();

export const DO_SPACE_CONFIG = {
  endpoint: process.env.DO_SPACE_ENDPOINT || "",
  region: process.env.DO_SPACE_REGION || "",
  accessKey: process.env.DO_SPACE_ACCESSKEY || "",
  secretKey: process.env.DO_SPACE_SECRETKEY || "",
};

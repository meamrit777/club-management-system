export const getEnvConfig = () => {
  const MODE = process.env.NODE_ENV ?? "development";

  const MONGO_CONNECTION_URI =
    MODE === "production" ? process.env.MONGO_URI_PROD : process.env.MONGO_URI;
  const LIVE_URL =
    MODE === "production"
      ? process.env.PROD_LIVE_URL
      : process.env.DEMO_LIVE_URL;

  const JWT_SECRET = process.env.JWT_SECRET;

  return {
    MODE,
    MONGO_CONNECTION_URI,
    LIVE_URL,
    JWT_SECRET,
  };
};

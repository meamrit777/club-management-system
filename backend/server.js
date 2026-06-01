import dotenv from "dotenv";
import express from "express";
import http from "http";
import path from "path";
import { corsMiddleware } from "./config/cors.config.js";
import { connectDB } from "./config/db.config.js";

// import { ERROR_HANDLER, NOT_FOUND_HANDLER } from "./middlewares/errorMiddleware.js";

const __dirname = path.resolve(path.dirname(""));

dotenv.config();

// // import { instantiateSocket } from "./socket/socket.io.js";
// import { scheduleNotifications } from "./cron/scheduleNotifications.js";
// import { scheduleTasks } from "./cron/scheduleTasks.js";

import userRoutes from "./routes/userRoutes.js";

await connectDB();

const app = express();
app.use(corsMiddleware);

const server = http.createServer(app);

app.use(express.json());

app.set("view engine", "ejs");

// app.use("/api/accounts", accountRoutes);
// app.use("/api/account-list", accountListRoutes);
// app.use("/api/authorizations", authorizationRoutes);
// app.use("/api/admin-dashboard", adminDashboardRoutes);

app.use("/api/users", userRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/build")));
  app.get("*", (_, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html")),
  );
} else {
  app.get("/", (_, res) => {
    res.send("CLUB Api is running! 🏃‍♂️🏃‍♂️🏃‍♂️");
  });
}

// app.use(ERROR_HANDLER);
// app.use(NOT_FOUND_HANDLER);

// invoking scheduled cron tasks
// scheduleTasks();
// scheduleNotifications();

const PORT = process.env.PORT || 5001;

server.listen(PORT, console.log(`Server 🚀🚀🚀  in ${process.env.NODE_ENV} at ${PORT}`));

// const server = app.listen(
//   PORT,
//   console.log(`Server 🚀🚀🚀  in ${process.env.NODE_ENV} at ${PORT}`)
// );

// initializing sockets
// instantiateSocket(server);

// these two lines prevent unhandled promise rejection and uncaught exceptions from crashing the whole application down
process.on("unhandledRejection", (error, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", error);
});

process.on("uncaughtException", (error, promise) => {
  console.log("Uncaught Exception at:", promise, "reason:", error);
});

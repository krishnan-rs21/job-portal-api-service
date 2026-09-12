import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "./lib/redis";
import authRoutes from "./routes/auth.route";
import jobRoutes from "./routes/job.route";
import v1Routes from "./routes/v1.route";

dotenv.config();
// ...
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/v1", v1Routes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

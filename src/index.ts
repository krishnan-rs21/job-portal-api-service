import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "./lib/redis";
import authRoutes from "./routes/auth.route";
import jobRoutes from "./routes/job.route";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Distributed Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - ioredis and rate-limit-redis type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
});

app.use("/api/", limiter);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "./lib/redis";
import { AppDataSource } from "./data-source";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  await AppDataSource.initialize();
  console.log("Database connected");

  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      store: new RedisStore({
        sendCommand: (...args: string[]) =>
          redis.call(args[0] as any, ...args.slice(1)) as any,
      }),
    }),
  );

  const { default: authRoutes } = await import("./routes/auth.route");
  const { default: jobRoutes } = await import("./routes/job.route");
  const { default: v1Routes } = await import("./routes/v1.route");

  app.use("/api/auth", authRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/api/v1", v1Routes);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

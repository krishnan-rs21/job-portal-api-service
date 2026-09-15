import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

const redis = new Redis(redisUrl || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("Successfully connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export const cacheData = async (
  key: string,
  value: any,
  ttl: number = 3600,
) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (error) {
    console.error(`Error caching data for key ${key}:`, error);
  }
};

export const getCachedData = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting cached data for key ${key}:`, error);
    return null;
  }
};

export const invalidateCache = async (key: string) => {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Error invalidating cache for key ${key}:`, error);
  }
};

export default redis;

import Redis from "ioredis";
declare const redis: Redis<"legacy">;
export declare const cacheData: (key: string, value: any, ttl?: number) => Promise<void>;
export declare const getCachedData: <T>(key: string) => Promise<T | null>;
export declare const invalidateCache: (key: string) => Promise<void>;
export default redis;
//# sourceMappingURL=redis.d.ts.map
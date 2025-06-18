import Redis from "ioredis";
import { RedisClient } from "ioredis/built/connectors/SentinelConnector/types";

// Create a new Redis client instance
const redisUrl = process.env.REDIS_URL as string;
const createRedisClient = (purpose: string) => {
    const redisClient = new Redis(redisUrl, {
        tls: {
            rejectUnauthorized: false,
        },
        keepAlive: 1000 * 30,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000); // Exponential backoff up to 2 seconds
            console.warn(`Redis (${purpose}) connection attempt ${times} failed, retrying in ${delay}ms`);
            return delay;
        },
        maxRetriesPerRequest: 3, // Optional: Limit retries for individual commands
    });

    redisClient.on("connect", () => {
        console.info(`🔌 Connected to Redis successfully (${purpose}).`);
    });

    redisClient.on("error", (error) => {
        // Use Fastify logger if available, otherwise console
        console.error({ err: error }, `❌ Redis connection error (${purpose})`);
    });

    // return
    return redisClient;
}

export type PubSub = {
    pub: Redis;
    sub: Redis;
}

export const createPubSub = (name: string) : PubSub => {
    return {
        pub: createRedisClient(`${name}-publish`),
        sub: createRedisClient(`${name}-subscribe`)
    };
}

// Export the client instance for use in other parts of the application
export default createRedisClient;

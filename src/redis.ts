import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";

const RedisStore = connectRedis(session);
const redis = new Redis();

export { RedisStore, redis, session };

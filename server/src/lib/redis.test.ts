import {
    redisDel,
    redisGet,
    redisGetJson,
    redisSetEx,
    redisSetJson,
    resetRedisClientForTests,
    setRedisClientForTests,
} from "./redis";

beforeEach(() => {
    resetRedisClientForTests();
});

afterEach(() => {
    resetRedisClientForTests();
    delete process.env.REDIS_URL;
});

it("no-ops when REDIS_URL is unset", async () => {
    delete process.env.REDIS_URL;
    resetRedisClientForTests();
    await expect(redisGet("k")).resolves.toBeNull();
    await expect(redisSetEx("k", 1, "v")).resolves.toBeUndefined();
    await expect(redisDel("k")).resolves.toBeUndefined();
});

it("returns null and continues when injected client throws", async () => {
    const fake = {
        status: "ready",
        get: jest.fn().mockRejectedValue(new Error("down")),
        setex: jest.fn().mockRejectedValue(new Error("down")),
        del: jest.fn().mockRejectedValue(new Error("down")),
        quit: jest.fn().mockResolvedValue("OK"),
        on: jest.fn(),
    };
    setRedisClientForTests(fake as never);

    await expect(redisGet("k")).resolves.toBeNull();
    await expect(redisSetEx("k", 5, "v")).resolves.toBeUndefined();
    await expect(redisDel("k")).resolves.toBeUndefined();
});

it("getJson/setJson round-trip through the injected client", async () => {
    const store = new Map<string, string>();
    const fake = {
        status: "ready",
        get: jest.fn(async (key: string) => store.get(key) ?? null),
        setex: jest.fn(async (key: string, _ttl: number, value: string) => {
            store.set(key, value);
            return "OK";
        }),
        del: jest.fn(async (key: string) => {
            store.delete(key);
            return 1;
        }),
        quit: jest.fn().mockResolvedValue("OK"),
        on: jest.fn(),
    };
    setRedisClientForTests(fake as never);

    await redisSetJson("k", 15, { a: 1 });
    await expect(redisGetJson<{ a: number }>("k")).resolves.toEqual({ a: 1 });
    await redisDel("k");
    await expect(redisGetJson("k")).resolves.toBeNull();
});

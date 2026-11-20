import {
    invalidateTasksListCache,
    readTasksListCache,
    tasksListCacheKey,
    TASKS_LIST_CACHE_TTL_SECONDS,
    writeTasksListCache,
} from "./tasksListCache";

const mockGetJson = jest.fn();
const mockSetJson = jest.fn();
const mockDel = jest.fn();

jest.mock("@/lib/redis", () => ({
    redisGetJson: (...args: unknown[]) => mockGetJson(...args),
    redisSetJson: (...args: unknown[]) => mockSetJson(...args),
    redisDel: (...args: unknown[]) => mockDel(...args),
}));

beforeEach(() => {
    mockGetJson.mockReset();
    mockSetJson.mockReset();
    mockDel.mockReset();
});

it("builds a stable org cache key", () => {
    expect(tasksListCacheKey("org-1")).toBe("tasks:list:org:org-1");
});

it("reads JSON from redis", async () => {
    mockGetJson.mockResolvedValue([{ id: "issue-1" }]);
    await expect(readTasksListCache("org-1")).resolves.toEqual([
        { id: "issue-1" },
    ]);
    expect(mockGetJson).toHaveBeenCalledWith("tasks:list:org:org-1");
});

it("writes JSON with the 15s TTL", async () => {
    mockSetJson.mockResolvedValue(undefined);
    await writeTasksListCache("org-1", [{ id: "issue-1" }]);
    expect(mockSetJson).toHaveBeenCalledWith(
        "tasks:list:org:org-1",
        TASKS_LIST_CACHE_TTL_SECONDS,
        [{ id: "issue-1" }],
    );
});

it("invalidates by deleting the org key", async () => {
    mockDel.mockResolvedValue(undefined);
    await invalidateTasksListCache("org-1");
    expect(mockDel).toHaveBeenCalledWith("tasks:list:org:org-1");
});

it("skips invalidate when orgId is empty", async () => {
    await invalidateTasksListCache("");
    expect(mockDel).not.toHaveBeenCalled();
});

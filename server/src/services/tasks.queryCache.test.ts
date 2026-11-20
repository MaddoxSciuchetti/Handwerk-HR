const mockFindMany = jest.fn();
const mockMentionFindMany = jest.fn();
const mockReadCache = jest.fn();
const mockWriteCache = jest.fn();

jest.mock("@/lib/prisma", () => ({
    prisma: {
        issue: { findMany: (...args: unknown[]) => mockFindMany(...args) },
        issueMention: {
            findMany: (...args: unknown[]) => mockMentionFindMany(...args),
        },
    },
}));

jest.mock("@/services/tasksListCache", () => ({
    readTasksListCache: (...args: unknown[]) => mockReadCache(...args),
    writeTasksListCache: (...args: unknown[]) => mockWriteCache(...args),
    invalidateTasksListCache: jest.fn(),
}));

jest.mock("@/services/worker.service", () => ({
    createIssue: jest.fn(),
    updateIssue: jest.fn(),
}));

jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));

import { queryTasks } from "./tasks.service";

const sampleIssue = {
    id: "issue-1",
    title: "Task",
    assignee: { id: "u1", firstName: "A", lastName: "B" },
    workerEngagement: {
        workerId: "w1",
        templateApplication: null,
        worker: { firstName: "H", lastName: "R" },
    },
};

beforeEach(() => {
    mockFindMany.mockReset();
    mockMentionFindMany.mockReset();
    mockReadCache.mockReset();
    mockWriteCache.mockReset();
});

it("on cache miss loads from Prisma, writes cache, and attaches mentions", async () => {
    mockReadCache.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([sampleIssue]);
    mockWriteCache.mockResolvedValue(undefined);
    mockMentionFindMany.mockResolvedValue([{ issueId: "issue-1" }]);

    const result = await queryTasks("org-1", "viewer-1");

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    expect(mockWriteCache).toHaveBeenCalledWith("org-1", [sampleIssue]);
    expect(mockMentionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
            where: expect.objectContaining({
                userId: "viewer-1",
                issueId: { in: ["issue-1"] },
            }),
        }),
    );
    expect(result).toEqual([
        expect.objectContaining({ id: "issue-1", mentioned: true }),
    ]);
    expect(result[0]).not.toHaveProperty("mentions");
});

it("on cache hit skips Prisma issue findMany and still overlays mentions", async () => {
    mockReadCache.mockResolvedValue([sampleIssue]);
    mockMentionFindMany.mockResolvedValue([]);

    const result = await queryTasks("org-1", "viewer-1");

    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockWriteCache).not.toHaveBeenCalled();
    expect(mockMentionFindMany).toHaveBeenCalled();
    expect(result).toEqual([
        expect.objectContaining({ id: "issue-1", mentioned: false }),
    ]);
});

it("when Redis read fails open (null) still serves from Postgres", async () => {
    mockReadCache.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([sampleIssue]);
    mockWriteCache.mockResolvedValue(undefined);
    mockMentionFindMany.mockResolvedValue([]);

    await expect(queryTasks("org-1", "viewer-1")).resolves.toEqual([
        expect.objectContaining({ id: "issue-1", mentioned: false }),
    ]);
    expect(mockFindMany).toHaveBeenCalled();
});

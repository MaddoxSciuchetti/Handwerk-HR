import { requireCronSecret } from "@/middleware/requireCronSecret";
import { postAnniversaryReminders } from "./anniversaryReminders.controller";
import { runAnniversaryReminders } from "@/services/anniversaryReminders";

jest.mock("@/services/anniversaryReminders", () => ({
    runAnniversaryReminders: jest.fn(),
}));

const originalSecret = process.env.CRON_SECRET;
let response: any;
let next: jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
    response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    process.env.CRON_SECRET = "cron-secret";
});

afterAll(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
});

it.each([undefined, "", "Bearer wrong", "Bearer cron-secrex", "cron-secret"])(
    "rejects invalid authorization %s",
    (header) => {
        requireCronSecret({ get: () => header } as any, response, next);
        expect(response.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    },
);

it("accepts the exact bearer token", () => {
    requireCronSecret(
        { get: () => "Bearer cron-secret" } as any,
        response,
        next,
    );
    expect(next).toHaveBeenCalledWith();
});

it("returns zero counts on an empty day", async () => {
    (runAnniversaryReminders as jest.Mock).mockResolvedValue({
        processed: 0,
        succeeded: 0,
        failed: 0,
    });
    await postAnniversaryReminders({} as any, response, next);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
        processed: 0,
        succeeded: 0,
        failed: 0,
    });
});

it("signals cron failure when any send fails", async () => {
    (runAnniversaryReminders as jest.Mock).mockResolvedValue({
        processed: 2,
        succeeded: 1,
        failed: 1,
    });
    await postAnniversaryReminders({} as any, response, next);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
        processed: 2,
        succeeded: 1,
        failed: 1,
    });
});

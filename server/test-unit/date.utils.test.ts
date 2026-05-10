import {
    fifteenMinutesFromNow,
    fiveMinutesAgo,
    ONE_DAY_MS,
    oneHourFromNow,
    oneYearFromNow,
    sevenDaysFromNow,
    thirtyDaysFromNow,
} from "@/utils/date";

describe("date utils", () => {
    const FIXED_NOW_MS = 1_700_000_000_000;

    beforeEach(() => {
        jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW_MS);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("fiveMinutesAgo subtracts 5 minutes from now", () => {
        expect(fiveMinutesAgo().getTime()).toBe(FIXED_NOW_MS - 5 * 60 * 1000);
    });

    it("fifteenMinutesFromNow adds 15 minutes to now", () => {
        expect(fifteenMinutesFromNow().getTime()).toBe(
            FIXED_NOW_MS + 15 * 60 * 1000,
        );
    });

    it("oneHourFromNow adds 1 hour to now", () => {
        expect(oneHourFromNow().getTime()).toBe(FIXED_NOW_MS + 60 * 60 * 1000);
    });

    it("oneYearFromNow adds 365 days to now", () => {
        expect(oneYearFromNow().getTime()).toBe(
            FIXED_NOW_MS + 365 * 24 * 60 * 60 * 1000,
        );
    });

    it("thirtyDaysFromNow adds 30 days to now", () => {
        expect(thirtyDaysFromNow().getTime()).toBe(
            FIXED_NOW_MS + 30 * 24 * 60 * 60 * 1000,
        );
    });

    it("sevenDaysFromNow adds 7 days to now", () => {
        expect(sevenDaysFromNow().getTime()).toBe(
            FIXED_NOW_MS + 7 * 24 * 60 * 60 * 1000,
        );
    });

    it("ONE_DAY_MS is milliseconds in one day", () => {
        expect(ONE_DAY_MS).toBe(24 * 60 * 60 * 1000);
    });
});

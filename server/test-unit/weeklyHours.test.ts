import { clearUndistributedWeekdays, normalizeHour, suggestWeekdayLinks } from "../../shared/weeklyHours";

describe("weekly hours", () => {
    it("treats blank as unspecified and zero as no hours", () => {
        expect(normalizeHour("")).toBeUndefined();
        expect(normalizeHour("0")).toBe("0");
        expect(normalizeHour("7,50")).toBe("7,5");
        expect(normalizeHour("30")).toBeNull();
    });

    it("suggests one contract field per weekday and ignores unrelated words", () => {
        expect(
            suggestWeekdayLinks([
                { key: "arbeitszeit.mo", label: "Montag" },
                { key: "arbeitszeit.di", label: "Dienstag" },
                { key: "contract.also", label: "Weitere Hinweise" },
                { key: "contract.freitag", label: "Freitag" },
            ]),
        ).toEqual({
            hoursMonday: "arbeitszeit.mo",
            hoursTuesday: "arbeitszeit.di",
            hoursFriday: "contract.freitag",
        });
    });

    it("drops weekday hours unless the distribution was accepted", () => {
        const fields = [
            { key: "hoursDistribution" },
            { key: "hoursMonday" },
            { key: "hoursSunday" },
        ];
        const cleared = clearUndistributedWeekdays(fields, {
            hoursDistribution: "nein",
            hoursMonday: "8",
            hoursSunday: "0",
        });
        expect(cleared.hoursDistribution).toBe("nein");
        expect(cleared.hoursMonday).toBe("");
        expect(cleared.hoursSunday).toBe("");
        expect(
            clearUndistributedWeekdays(fields, {
                hoursDistribution: "ja",
                hoursMonday: "0",
                hoursSunday: "",
            }).hoursMonday,
        ).toBe("0");
    });

    it("keeps office hours when the worker does not distribute them", () => {
        expect(
            clearUndistributedWeekdays(
                [
                    { key: "hoursDistribution" },
                    { key: "hoursMonday", officeOnly: true },
                ],
                { hoursDistribution: "", hoursMonday: "8" },
            ).hoursMonday,
        ).toBe("8");
    });
});

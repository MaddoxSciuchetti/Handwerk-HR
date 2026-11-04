import {
    isAccessGroup,
    normalizeAccessGroupIds,
} from "./accessGroups";

describe("normalizeAccessGroupIds", () => {
    it("keeps unique valid GUIDs", () => {
        expect(
            normalizeAccessGroupIds([
                "11111111-1111-1111-1111-111111111111",
                " 11111111-1111-1111-1111-111111111111 ",
                "not-a-guid",
                "22222222-2222-2222-2222-222222222222",
                3,
            ]),
        ).toEqual([
            "11111111-1111-1111-1111-111111111111",
            "22222222-2222-2222-2222-222222222222",
        ]);
    });

    it("returns an empty list for missing values", () => {
        expect(normalizeAccessGroupIds(null)).toEqual([]);
        expect(normalizeAccessGroupIds(undefined)).toEqual([]);
        expect(normalizeAccessGroupIds({})).toEqual([]);
    });
});

describe("isAccessGroup", () => {
    it("includes security and Microsoft 365 groups", () => {
        expect(
            isAccessGroup({
                displayName: "Handwerk",
                securityEnabled: true,
                groupTypes: [],
            }),
        ).toBe(true);
        expect(
            isAccessGroup({
                displayName: "Büro",
                securityEnabled: false,
                groupTypes: ["Unified"],
            }),
        ).toBe(true);
    });

    it("excludes role-assignable and system groups", () => {
        expect(
            isAccessGroup({
                displayName: "Admins",
                securityEnabled: true,
                isAssignableToRole: true,
            }),
        ).toBe(false);
        expect(
            isAccessGroup({
                displayName: "AAD DC Administrators",
                securityEnabled: true,
            }),
        ).toBe(false);
    });
});

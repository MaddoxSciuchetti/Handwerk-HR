import { isMicrosoftAddressConflict } from "./addressConflict";

const takenAddress = {
    error: {
        code: "Request_BadRequest",
        message:
            "Another object with the same value for property userPrincipalName already exists.",
        details: [
            {
                code: "ObjectConflict",
                message:
                    "Another object with the same value for property userPrincipalName already exists.",
                target: "userPrincipalName",
            },
        ],
    },
};

it("treats Graph's 400 address conflict as a taken sign-in address", () => {
    expect(isMicrosoftAddressConflict(400, takenAddress)).toBe(true);
    expect(
        isMicrosoftAddressConflict(400, {
            error: {
                code: "Request_MultipleObjectsWithSameKeyValue",
                message:
                    "Another object with the same value for property proxyAddresses already exists.",
            },
        }),
    ).toBe(true);
    expect(isMicrosoftAddressConflict(409, {})).toBe(true);
});

it("does not retry other Graph rejections", () => {
    expect(
        isMicrosoftAddressConflict(400, {
            error: {
                code: "Request_BadRequest",
                message:
                    "The specified password does not comply with password complexity requirements.",
            },
        }),
    ).toBe(false);
    expect(isMicrosoftAddressConflict(403, takenAddress)).toBe(false);
});

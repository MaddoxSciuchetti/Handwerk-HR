import { contractTokenFromSubject } from "@/services/signedContractReturn.service";

describe("contractTokenFromSubject", () => {
    it("reads the contract token from a reply subject", () => {
        const token = "6f1e2d3c-4b5a-6978-90ab-cdef12345678";
        expect(
            contractTokenFromSubject(`Re: Ihr Arbeitsvertrag [${token}]`),
        ).toBe(token);
    });

    it("ignores mail that is not a contract reply", () => {
        expect(contractTokenFromSubject("Bitte füllen Sie den Personalfragebogen aus")).toBe(
            null,
        );
    });
});
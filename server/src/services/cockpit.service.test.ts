import {
    clearCockpitCache,
    COCKPIT_CACHE_TTL_MS,
    getCockpitData,
    invalidateCockpitCache,
} from "@/services/cockpit.service";
import { listClothingStock } from "@/services/clothingStock.service";
import { listDocumentMasters } from "@/services/documentMaster.service";
import {
    employmentContractFields,
    questionnaireForOrganization,
} from "@/services/questionnaireTemplate";
import { queryTemplates } from "@/services/template.service";

jest.mock("@/services/template.service", () => ({
    queryTemplates: jest.fn(),
}));
jest.mock("@/services/documentMaster.service", () => ({
    listDocumentMasters: jest.fn(),
}));
jest.mock("@/services/questionnaireTemplate", () => ({
    questionnaireForOrganization: jest.fn(),
    employmentContractFields: jest.fn(),
}));
jest.mock("@/services/questionnaireDefinition", () => ({
    builtinCatalog: jest.fn(() => [{ key: "catalog" }]),
}));
jest.mock("@/services/clothingStock.service", () => ({
    listClothingStock: jest.fn(),
}));

const templates = queryTemplates as jest.MockedFunction<typeof queryTemplates>;
const documents = listDocumentMasters as jest.MockedFunction<
    typeof listDocumentMasters
>;
const questionnaire = questionnaireForOrganization as jest.MockedFunction<
    typeof questionnaireForOrganization
>;
const contractFields = employmentContractFields as jest.MockedFunction<
    typeof employmentContractFields
>;
const bestand = listClothingStock as jest.MockedFunction<
    typeof listClothingStock
>;

describe("cockpit cache", () => {
    beforeEach(() => {
        clearCockpitCache();
        jest.clearAllMocks();
        jest.useFakeTimers();
        templates.mockResolvedValue([{ id: "t1" }] as never);
        documents.mockResolvedValue([{ id: "d1" }] as never);
        questionnaire.mockResolvedValue({
            name: "q",
            items: [],
        } as never);
        contractFields.mockResolvedValue([{ key: "hours", label: "Hours" }]);
        bestand.mockResolvedValue([{ id: "b1" }] as never);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("loads from the database once per organization within the TTL", async () => {
        const first = await getCockpitData("org-a");
        const second = await getCockpitData("org-a");

        expect(first.templates).toEqual([{ id: "t1" }]);
        expect(second).toBe(first);
        expect(templates).toHaveBeenCalledTimes(1);
        expect(documents).toHaveBeenCalledTimes(1);
        expect(questionnaire).toHaveBeenCalledTimes(1);
        expect(bestand).toHaveBeenCalledTimes(1);
    });

    it("keeps organizations isolated by cache key", async () => {
        await getCockpitData("org-a");
        await getCockpitData("org-b");

        expect(templates).toHaveBeenCalledTimes(2);
        expect(templates).toHaveBeenNthCalledWith(1, "org-a");
        expect(templates).toHaveBeenNthCalledWith(2, "org-b");
    });

    it("coalesces concurrent misses for the same organization", async () => {
        let resolveLoad!: () => void;
        const gate = new Promise<void>((resolve) => {
            resolveLoad = resolve;
        });
        templates.mockImplementation(async () => {
            await gate;
            return [{ id: "t1" }] as never;
        });

        const first = getCockpitData("org-a");
        const second = getCockpitData("org-a");
        resolveLoad();
        const [a, b] = await Promise.all([first, second]);

        expect(a).toBe(b);
        expect(templates).toHaveBeenCalledTimes(1);
    });

    it("reloads after invalidateCockpitCache", async () => {
        await getCockpitData("org-a");
        invalidateCockpitCache("org-a");
        await getCockpitData("org-a");

        expect(templates).toHaveBeenCalledTimes(2);
    });

    it("reloads after the TTL expires", async () => {
        await getCockpitData("org-a");
        jest.advanceTimersByTime(COCKPIT_CACHE_TTL_MS + 1);
        await getCockpitData("org-a");

        expect(templates).toHaveBeenCalledTimes(2);
    });
});

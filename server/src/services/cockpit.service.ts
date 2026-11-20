import { listClothingStock } from "@/services/clothingStock.service";
import { listDocumentMasters } from "@/services/documentMaster.service";
import { builtinCatalog } from "@/services/questionnaireDefinition";
import {
    employmentContractFields,
    questionnaireForOrganization,
} from "@/services/questionnaireTemplate";
import { queryTemplates } from "@/services/template.service";
import { TtlCache } from "@/utils/ttlCache";

/** Short TTL so Cockpit panels stay snappy without Redis. */
export const COCKPIT_CACHE_TTL_MS = 30_000;

export type CockpitData = {
    templates: Awaited<ReturnType<typeof queryTemplates>>;
    documents: Awaited<ReturnType<typeof listDocumentMasters>>;
    questionnaire: Awaited<ReturnType<typeof questionnaireForOrganization>> & {
        catalog: ReturnType<typeof builtinCatalog>;
        contractFields: Awaited<ReturnType<typeof employmentContractFields>>;
    };
    bestand: Awaited<ReturnType<typeof listClothingStock>>;
};

const cache = new TtlCache<CockpitData>(COCKPIT_CACHE_TTL_MS);
const inflight = new Map<string, Promise<CockpitData>>();

export function invalidateCockpitCache(organizationId: string): void {
    cache.delete(organizationId);
    inflight.delete(organizationId);
}

/** Test helper — drop every org entry. */
export function clearCockpitCache(): void {
    cache.clear();
    inflight.clear();
}

async function loadCockpitData(organizationId: string): Promise<CockpitData> {
    const [templates, documents, definition, contractFields, bestand] =
        await Promise.all([
            queryTemplates(organizationId),
            listDocumentMasters(organizationId),
            questionnaireForOrganization(organizationId),
            employmentContractFields(organizationId),
            listClothingStock(organizationId),
        ]);

    return {
        templates,
        documents,
        questionnaire: {
            ...definition,
            catalog: builtinCatalog(),
            contractFields,
        },
        bestand,
    };
}

/**
 * Cockpit snapshot for one organization.
 * Cache key = organizationId. Fresh loads hit Postgres; hits skip DB.
 */
export async function getCockpitData(
    organizationId: string,
): Promise<CockpitData> {
    const hit = cache.get(organizationId);
    if (hit) return hit;

    const pending = inflight.get(organizationId);
    if (pending) return pending;

    const load = loadCockpitData(organizationId)
        .then((data) => {
            cache.set(organizationId, data);
            return data;
        })
        .finally(() => {
            inflight.delete(organizationId);
        });

    inflight.set(organizationId, load);
    return load;
}

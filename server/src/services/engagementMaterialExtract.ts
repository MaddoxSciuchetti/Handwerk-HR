export type MaterialLine = {
    name: string;
    articleNumber: string;
    quantity: number;
    unitPrice: number;
};

const NAME_MAX = 255;
const ARTICLE_MAX = 120;

function asRecord(value: unknown): Record<string, unknown> | null {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

export function parseUnitPrice(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return roundMoney(value);
    }
    if (typeof value !== "string") return 0;
    const trimmed = value.trim().replace(/\s/g, "").replace(/€/g, "");
    if (!trimmed) return 0;
    const normalized = trimmed.includes(",")
        ? trimmed.replace(/\./g, "").replace(",", ".")
        : trimmed;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return 0;
    return roundMoney(parsed);
}

function roundMoney(value: number): number {
    const rounded = Math.round(Math.abs(value) * 100) / 100;
    return rounded;
}

export function parseQuantity(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(1, Math.round(value));
    }
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value.trim().replace(",", "."));
        if (Number.isFinite(parsed)) return Math.max(1, Math.round(parsed));
    }
    return 1;
}

function clip(value: string, max: number): string {
    return value.trim().slice(0, max);
}

export function parseMaterialLines(payload: unknown): MaterialLine[] {
    const record = asRecord(payload);
    const rawItems = record?.items ?? payload;
    if (!Array.isArray(rawItems)) return [];

    const lines: MaterialLine[] = [];
    for (const item of rawItems) {
        const row = asRecord(item);
        if (!row) continue;
        const name = clip(String(row.name ?? ""), NAME_MAX);
        if (!name) continue;
        lines.push({
            name,
            articleNumber: clip(String(row.articleNumber ?? ""), ARTICLE_MAX),
            quantity: parseQuantity(row.quantity),
            unitPrice: parseUnitPrice(row.unitPrice),
        });
    }
    return lines;
}

export function parseMaterialLinesFromModel(content: string): MaterialLine[] {
    const parsed: unknown = JSON.parse(content);
    return parseMaterialLines(parsed);
}

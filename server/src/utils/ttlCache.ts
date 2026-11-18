/** Simple process-local TTL map. Not shared across instances. */
export class TtlCache<T> {
    private readonly entries = new Map<string, { expiresAt: number; value: T }>();

    constructor(private readonly ttlMs: number) {}

    get(key: string): T | undefined {
        const hit = this.entries.get(key);
        if (!hit) return undefined;
        if (hit.expiresAt <= Date.now()) {
            this.entries.delete(key);
            return undefined;
        }
        return hit.value;
    }

    set(key: string, value: T): void {
        this.entries.set(key, {
            expiresAt: Date.now() + this.ttlMs,
            value,
        });
    }

    delete(key: string): void {
        this.entries.delete(key);
    }

    clear(): void {
        this.entries.clear();
    }
}

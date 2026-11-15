import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContext = {
    requestId: string;
    traceId?: string;
    spanId?: string;
    userId?: string;
    orgId?: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Bind context for the remainder of this request's async work.
 * Uses enterWith so Express middleware/handlers keep correlation after next().
 */
export function bindRequestContext(context: RequestContext): void {
    storage.enterWith(context);
}

export function runWithRequestContext<T>(
    context: RequestContext,
    fn: () => T,
): T {
    return storage.run(context, fn);
}

export function getRequestContext(): RequestContext | undefined {
    return storage.getStore();
}

export function updateRequestContext(
    patch: Partial<Omit<RequestContext, "requestId">>,
): void {
    const current = storage.getStore();
    if (!current) return;
    Object.assign(current, patch);
}

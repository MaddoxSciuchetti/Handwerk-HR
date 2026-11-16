/**
 * Collapse path params so Sentry metric `route` attributes stay low-cardinality
 * and never carry capability secrets (invite tokens are 64-char hex, not UUIDs).
 */
export function metricRoute(path: string): string {
    return path
        .replace(
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
            ":id",
        )
        .replace(/\/[0-9a-f]{16,}(?=\/|$)/gi, "/:token")
        .replace(/\/\d+(?=\/|$)/g, "/:id");
}

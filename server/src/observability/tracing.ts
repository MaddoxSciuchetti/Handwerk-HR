import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
    BatchSpanProcessor,
    ConsoleSpanExporter,
    SimpleSpanProcessor,
    type SpanExporter,
} from "@opentelemetry/sdk-trace";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import {
    LOG_LEVEL,
    NODE_ENV,
    OTEL_EXPORTER_OTLP_ENDPOINT,
} from "@/constants/env";
import { logger } from "./logger";

const SERVICE_NAME = "handwerk-hr-server";

let sdk: NodeSDK | undefined;

export function isOtlpEnabled(): boolean {
    return Boolean(OTEL_EXPORTER_OTLP_ENDPOINT);
}

function buildTraceExporters(): SpanExporter[] {
    const exporters: SpanExporter[] = [new ConsoleSpanExporter()];
    if (isOtlpEnabled()) {
        exporters.push(
            new OTLPTraceExporter({
                url: OTEL_EXPORTER_OTLP_ENDPOINT,
            }),
        );
    }
    return exporters;
}

/** Must run before Express is imported so HTTP auto-instrumentation can patch. */
export function startTracing(): void {
    if (sdk || NODE_ENV === "test") {
        return;
    }

    const exporters = buildTraceExporters();
    const spanProcessors = exporters.map((exporter) =>
        NODE_ENV === "production"
            ? new BatchSpanProcessor({ exporter })
            : new SimpleSpanProcessor({ exporter }),
    );

    sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: SERVICE_NAME,
        }),
        spanProcessors,
        instrumentations: [
            getNodeAutoInstrumentations({
                "@opentelemetry/instrumentation-fs": { enabled: false },
                "@opentelemetry/instrumentation-dns": { enabled: false },
            }),
        ],
    });

    sdk.start();

    logger.info("Observability started", {
        event: "observability.started",
        outcome: "ok",
        nodeEnv: NODE_ENV,
        logLevel: LOG_LEVEL || (NODE_ENV === "production" ? "info" : "debug"),
        otlpEnabled: isOtlpEnabled(),
    });
}

export async function shutdownTracing(): Promise<void> {
    if (!sdk) return;
    const active = sdk;
    sdk = undefined;
    await active.shutdown();
}

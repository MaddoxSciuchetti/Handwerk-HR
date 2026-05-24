import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type TxCallback<T> = (tx: Prisma.TransactionClient) => Promise<T>;

type TxOptions = {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
};

type RetryOptions = {
    maxAttempts?: number;
    baseDelayMs?: number;
};

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 50;

const RETRYABLE_PRISMA_CODES = new Set(["P2034"]);

const isRetryablePrismaError = (err: unknown): boolean =>
    err instanceof Prisma.PrismaClientKnownRequestError &&
    RETRYABLE_PRISMA_CODES.has(err.code);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withTxRetry<T>(
    callback: TxCallback<T>,
    options: TxOptions & RetryOptions = {},
): Promise<T> {
    const {
        maxAttempts = DEFAULT_MAX_ATTEMPTS,
        baseDelayMs = DEFAULT_BASE_DELAY_MS,
        ...txOptions
    } = options;

    let lastErr: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await prisma.$transaction(callback, txOptions);
        } catch (err) {
            lastErr = err;

            if (!isRetryablePrismaError(err) || attempt === maxAttempts) {
                throw err;
            }

            await sleep(baseDelayMs * 2 ** (attempt - 1));
        }
    }

    throw lastErr;
}

import * as Sentry from "@sentry/node";
import { ErrorRequestHandler, Response } from "express";
import z from "zod";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../constants/http";
import { logger, serializeError } from "../observability/logger";
import AppError from "../utils/AppError";
import { clearAuthCookies, REFRESH_PATH } from "../utils/cookies";

const handleZodError = (res: Response, error: z.ZodError) => {
    const errors = error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
    }));
    return res.status(BAD_REQUEST).json({
        message: error.message,
        errors,
    });
};

const handleAppError = (res: Response, error: AppError) => {
    return res.status(error.statusCode).json({
        message: error.message,
        errorCode: error.errorCode,
    });
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
    const documentRequest =
        /document-masters|document-fonts|\/contract(?:\/|$)|arbeitszeugnis/.test(
            req.path,
        );

    const isAppError = error instanceof AppError;
    const isZodError = error instanceof z.ZodError;
    const statusCode = isZodError
        ? BAD_REQUEST
        : isAppError
          ? error.statusCode
          : INTERNAL_SERVER_ERROR;

    const logFields = {
        event: "http.error",
        outcome: isAppError || isZodError ? "rejected" : "internal_error",
        path: req.path,
        method: req.method,
        statusCode,
        requestId: req.requestId,
        ...(documentRequest ? { documentRequest: true } : {}),
        error: serializeError(error),
    };

    if (statusCode >= 500) {
        logger.error("Request failed", logFields);
        Sentry.captureException(error);
    } else {
        logger.warn("Request failed", logFields);
    }

    if (req.path === REFRESH_PATH) {
        clearAuthCookies(res);
    }

    if (isZodError) {
        return handleZodError(res, error);
    }

    if (isAppError) {
        return handleAppError(res, error);
    }

    return res.status(INTERNAL_SERVER_ERROR).json({
        message: "internal server",
        requestId: req.requestId,
    });
};

export default errorHandler;

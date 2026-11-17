import { CookieOptions, Response } from "express";
import { NODE_ENV } from "@/constants/env";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";

export const REFRESH_PATH = "/auth/v2/refresh";
export const AUTH_COOKIE_PATH = "/";
const isDevelopment = NODE_ENV === "development";
const isHttpsEnvironment = !isDevelopment;

const defaults: CookieOptions = {
    sameSite: isHttpsEnvironment ? "lax" : "lax",
    httpOnly: true,
    secure: isHttpsEnvironment,
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: fifteenMinutesFromNow(),
    path: AUTH_COOKIE_PATH,
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
    ...defaults,
    expires: thirtyDaysFromNow(),
    path: AUTH_COOKIE_PATH,
});

type Params = {
    res: Response;
    accessToken: string;
    refreshToken: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
    res
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

const clearCookieOptions: CookieOptions = {
    ...defaults,
    path: AUTH_COOKIE_PATH,
};

export const clearAuthCookies = (res: Response) =>
    res
        .clearCookie("accessToken", clearCookieOptions)
        .clearCookie("refreshToken", clearCookieOptions);

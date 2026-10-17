import { CookieOptions, Response } from "express";
import { fifteenMinutesFromNow, thirtyDaysFromNow } from "./date";

export const REFRESH_PATH = "/auth/v2/refresh";
export const AUTH_COOKIE_PATH = "/";
const isDevelopment = process.env.NODE_ENV === "development";
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

export const clearAuthCookies = (res: Response) =>
    res.clearCookie("accessToken").clearCookie("refreshToken", {
        path: AUTH_COOKIE_PATH,
    });

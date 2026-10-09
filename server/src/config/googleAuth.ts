import { google } from "googleapis";
import {
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI,
    GOOGLE_OAUTH_REFRESH_TOKEN,
} from "@/constants/env";

export function googleMailboxConfigured() {
    return (
        GOOGLE_OAUTH_CLIENT_ID.length > 0 &&
        GOOGLE_OAUTH_CLIENT_SECRET.length > 0 &&
        GOOGLE_OAUTH_REFRESH_TOKEN.length > 0
    );
}

export function getGoogleAuth() {
    const oauth2Client = new google.auth.OAuth2(
        GOOGLE_OAUTH_CLIENT_ID,
        GOOGLE_OAUTH_CLIENT_SECRET,
        GOOGLE_OAUTH_REDIRECT_URI,
    );
    oauth2Client.setCredentials({
        refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN,
    });
    return oauth2Client;
}

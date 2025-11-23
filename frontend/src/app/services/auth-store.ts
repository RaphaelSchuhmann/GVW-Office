/**
 * Simple localStorage-backed auth token store used in the renderer.
 * This file intentionally uses only browser storage APIs so it can be
 * bundled into the client build without pulling Node-only modules.
 */

const KEY = 'authToken';

export function setAuthToken(token: string) {
    try {
        localStorage.setItem(KEY, token);
    } catch (err) {
        // ignore storage errors (quota, private mode, etc.)
        console.error('setAuthToken failed:', err);
    }
}

export function getAuthToken(): string | undefined {
    try {
        const token = localStorage.getItem(KEY);
        return token ?? undefined;
    } catch (err) {
        console.error('getAuthToken failed:', err);
        return undefined;
    }
}

export function clearAuthToken() {
    try {
        localStorage.removeItem(KEY);
    } catch (err) {
        console.error('clearAuthToken failed:', err);
    }
}
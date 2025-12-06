/**
 * Simple localStorage-backed auth token store used in the renderer.
 * This file intentionally uses only browser storage APIs so it can be
 * bundled into the client build without pulling Node-only modules.
 */

export function setValue(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch (err) {
        // ignore storage errors (quota, private mode, etc.)
        console.error('setValue failed:', err);
    }
}

export function getValue(key: string): string {
    try {
        const token = localStorage.getItem(key);
        return token ?? "";
    } catch (err) {
        console.error('getValue failed:', err);
        return "";
    }
}

export function clearValue(key: string) {
    try {
        localStorage.removeItem(key);
    } catch (err) {
        console.error('clearValue failed:', err);
    }
}
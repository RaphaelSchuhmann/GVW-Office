import { get } from "svelte/store";
import { auth } from "../stores/auth";

export function normalizeResponse(response) {
    if (!response) return { ok: false, errorType: "NETWORK" };
    if (response.status === 400) return { ok: false, errorType: "BADREQUEST", status: 400 };
    if (response.status === 401) return { ok: false, errorType: "UNAUTHORIZED", status: 401 };
    if (response.status === 404) return { ok: false, errorType: "NOTFOUND", status: 404 };
    if (response.status === 409) return { ok: false, errorType: "ALREADYEXISTS", status: 409 };
    if (response.status === 429) return { ok: false, errorType: "REQUESTTIMEOUT", status: 429 };
    if (response.status >= 500) return { ok: false, errorType: "SERVER", status: response.status };

    return { ok: true, status: response.status };
}

export async function httpGet(url, customToken, doAuth = true) {
    const headers = {};
    const token = customToken ? customToken : get(auth).token;
    if (doAuth && token) headers["Authorization"] = `Bearer ${token}`;

    try {
        return await fetch(url, {
            method: "GET",
            headers: headers
        });
    } catch {
        return null;
    }
}

export async function httpPost(url, body, doAuth = true) {
    const headers = {};
    headers["Content-Type"] = "application/json";
    
    const token = get(auth).token;
    if (doAuth && token) headers["Authorization"] = `Bearer ${token}`;

    try {
        return await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });
    } catch {
        return null;
    }
}
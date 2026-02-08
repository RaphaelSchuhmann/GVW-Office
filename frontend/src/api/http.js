import { get } from "svelte/store";
import { auth } from "../stores/auth";

/**
 * Normalizes a fetch `Response` object into a consistent format.
 * 
 * Converts HTTP status codes and network errors into a standard oject
 * with `ok` and `errorType` fields, optionally including the original status code.
 * 
 * @param {Response | null} response 
 * @returns {{ ok: boolean, errorType?: string, status?: number }}
 * Returns `ok: true` for successfull responses, otherwise `ok: false` with a descriptive `errorType`.
 * 
 * @example
 * const normalized = normalizeResponse(resp);
 * if (!normalized.ok) console.error(normalized.errorType);
 */
export function normalizeResponse(response) {
    if (!response) return { ok: false, errorType: "NETWORK" };
    if (response.status === 400) return { ok: false, errorType: "BADREQUEST", status: 400 };
    if (response.status === 401) return { ok: false, errorType: "UNAUTHORIZED", status: 401 };
    if (response.status === 404) return { ok: false, errorType: "NOTFOUND", status: 404 };
    if (response.status === 409) return { ok: false, errorType: "RATELIMITED", status: 409 };
    if (response.status === 429) return { ok: false, errorType: "REQUESTTIMEOUT", status: 429 };
    if (response.status >= 500) return { ok: false, errorType: "SERVER", status: response.status };

    return { ok: true, status: response.status };
}

/**
 * Performs an HTTP GET request with optional bearer token authorization.
 * 
 * @param {string} url - The endpoint URL to fetch.
 * @param {string} [customToken=""] - Optional token to override the auth store token.
 * @param {boolean} [doAuth=true] - Whether to include the Authorization header.
 * @returns {Promise<Response | null>} The fetch response, or `null` if the request fails.
 * 
 * @example
 * const resp = await httpGet("/api/data");
 * if (resp?.ok) console.log(await resp.json());
 */
export async function httpGet(url, customToken = "", doAuth = true) {
    const headers = new Headers();
    const token = customToken ? customToken : get(auth).token;
    if (doAuth && token) headers.append("Authorization", `Bearer ${token}`);

    try {
        return await fetch(url, {
            method: "GET",
            headers: headers
        });
    } catch {
        return null;
    }
}

/**
 * Performs an HTTP POST request with JSON body and optional bearer token authorization.
 *
 * @param {string} url - The endpoint URL to post to.
 * @param {any} body - The data to send as JSON in the request body.
 * @param {string} [customToken=""] - Optional token to override the auth store token.
 * @param {boolean} [doAuth=true] - Whether to include the Authorization header.
 * @returns {Promise<Response | null>} The fetch response, or `null` if the request fails.
 *
 * @example
 * const resp = await httpPost("/api/update", { name: "Raphael" });
 * if (resp?.ok) console.log("Update successful");
 */
export async function httpPost(url, body, customToken = "", doAuth = true) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    const token = customToken ? customToken : get(auth).token;
    if (doAuth && token) headers.append("Authorization", `Bearer ${token}`);

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
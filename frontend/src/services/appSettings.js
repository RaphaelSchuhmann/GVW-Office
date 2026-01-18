import { get } from "svelte/store";
import { auth } from "../stores/auth";
import { appSettings } from "../stores/appSettings";

const apiUrl = __API_URL__;

/**
 * Fetches application settings from the server
 * @returns {Promise<Response>} API response with settings data
 */
export async function getSettings() {
    const currentAuth = get(auth);

    return await fetch(`${apiUrl}/settings/get`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAuth.token}`
        }
    });
}

/**
 * Updates the maximum members setting on the server
 * @returns {Promise<Response>} API response confirming the update
 */
export async function updateMaxMembers() {
    const currentAuth = get(auth);
    const currentSettings = get(appSettings);

    return await fetch(`${apiUrl}/settings/update/max-members`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAuth.token}`
        },
        body: JSON.stringify({ maxMembers: currentSettings.maxMembers })
    });
}
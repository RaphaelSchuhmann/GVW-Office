import { get } from "svelte/store";
import { user } from "../stores/user";
import { getUserData } from "../api/apiUser";
import { normalizeResponse } from "../api/http";
import { handleGlobalApiError } from "../api/globalErrorHandler";
import { isMobile } from "../stores/viewport";
import { addToast } from "../stores/toasts";

const USER_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Attempts to retrieve the latest user data from the API.
 * 
 * Only calls the API if `user` store is either empty, the `lastFetched`
 * is null or empty, or the last request was 2 minutes ago.
 * 
 * @returns {Promise<{void}>}
 */
export async function ensureUserData() {
    const { lastFetched, email } = get(user);

    if ((!lastFetched || isStale(lastFetched)) || !email) {
        const { resp, body } = await getUserData();
        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;
        
        if (!normalizedResponse.ok) {
            if (normalizedResponse.status === 404) {
                addToast({
                    title: "Benutzer nicht gefunden",
                    subTitle: !get(isMobile) ? "Es wurde kein Benutzer unter den angegebenen Daten gefunden." : "",
                    type: "error"
                });
                return;
            }
            return;
        }

        user.update(u => ({ ...u, name: body.name, email: body.email, role: body.role, address: body.address, phone: body.phone, loaded: true, lastFetched: Date.now() }));
        return;
    }
}

/**
 * Determines if the last request is 2 minutes or older.
 * 
 * @param {number} lastFetched - the timestamp of the last request
 * @returns {boolean}
 * If `lastFetched` is older than the `USER_CACHE_TTL_MS` it returns true.
 * Else it returns false.
 */
function isStale(lastFetched) {
    if (!lastFetched) return true;
    return Date.now() - lastFetched > USER_CACHE_TTL_MS;
}
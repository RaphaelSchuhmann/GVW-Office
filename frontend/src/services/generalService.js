import { get } from "svelte/store";
import { user } from "../stores/user";
import { getUserData } from "../api/apiUser";
import { normalizeResponse } from "../api/http";
import { handleGlobalApiError } from "../api/globalErrorHandler";
import { isMobile } from "../stores/viewport";
import { addToast } from "../stores/toasts";

const USER_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export async function ensureUserData() {
    const { lastFetched, email } = get(user);

    if ((!lastFetched || isStale(lastFetched)) && email) {
        const { resp, body } = await getUserData(email);
        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;
        
        if (normalizedResponse.status === 404) {
            addToast({
                title: "Benutzer nicht gefunden",
                subTitle: !get(isMobile) ? "Es wurde kein Benutzer unter der angegebenen E-Mail gefunden." : "",
                type: "error"
            });
            return;
        }

        user.update(u => ({ ...u, name: body.name, email: body.email, role: body.role, address: body.address, phone: body.phone, loaded: true, lastFetched: Date.now() }));
        return;
    }
}

function isStale(lastFetched) {
    if (!lastFetched) return true;
    return Date.now() - lastFetched > USER_CACHE_TTL_MS;
}
import {
    apiAddMember, apiCheckMember,
    apiDeleteMember,
    apiResetMembersPassword,
    apiUpdateMember,
    apiUpdateMemberStatus
} from "../api/apiMembers.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { addToast } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";
import { user } from "../stores/user.svelte.js";
import { membersStore } from "../stores/members.svelte.js";

export const voiceMap = {
    "1. Tenor": "tenor1",
    "2. Tenor": "tenor2",
    "1. Bass": "bass1",
    "2. Bass": "bass2",
    "tenor1": "1. Tenor",
    "tenor2": "2. Tenor",
    "bass1": "1. Bass",
    "bass2": "2. Bass"
};

export const statusMap = {
    "Aktiv": "active",
    "Passiv": "inactive",
    "active": "Aktiv",
    "inactive": "Passiv"
};

const isFetching = {
    checkMember: false,
    newMember: false,
    updateMember: false,
    updateStatus: false,
    deleteMember: false,
    resetPassword: false
};

/**
 * Centralized handler for member-related API errors.
 *
 * @param {string} errorType - Backend error type (e.g., BADREQUEST, NOTFOUND, CONFLICT)
 * @param {string} context - Operation context ("ADD", "UPDATE", "DELETE", "RESET", "STATUS")
 */
function handleMemberError(errorType, context) {
    const errorConfigs = {
        ADD: {
            CONFLICT: { title: "E-Mail-Adresse bereits verwendet", sub: "Die E-Mail-Adresse ist bereits einem anderen Mitglied zugeordnet." },
            BADREQUEST: { title: "Ungültige Daten", sub: "Bitte überprüfen Sie Ihre Eingaben. Einige Felder enthalten ungültige Werte." },
            DEFAULT: { title: "Fehler beim Hinzufügen", sub: "Beim Hinzufügen des neuen Mitglieds ist ein Fehler aufgetreten." },
        },
        UPDATE: {
            BADREQUEST: { title: "Unvollständige Daten", sub: "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." },
            NOTFOUND: { title: "Mitglied nicht gefunden", sub: "Das gewählte Mitglied wurde im System nicht gefunden." },
            CONFLICT: { title: "Speicher-Konflikt", sub: "Jemand anderes hat dieses Mitglied bereits bearbeitet. Bitte Seite aktualisieren, um die neuesten Daten zu sehen." },
            DEFAULT: { title: "Fehler beim Bearbeiten", sub: "Beim Bearbeiten der Mitgliedsdaten ist ein Fehler aufgetreten." }
        },
        DELETE: {
            BADREQUEST: { title: "Unvollständige Daten", sub: "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." },
            NOTFOUND: { title: "Mitglied nicht gefunden", sub: "Das gewählte Mitglied wurde im System nicht gefunden." },
            DEFAULT: { title: "Fehler beim Entfernen", sub: "Beim Entfernen des Mitglieds ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." }
        },
        RESET: {
            BADREQUEST: { title: "Unvollständige Daten", sub: "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." },
            NOTFOUND: { title: "Mitglied nicht gefunden", sub: "Das gewählte Mitglied wurde im System nicht gefunden." },
            DEFAULT: { title: "Fehler beim Zurücksetzen", sub: "Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." }
        },
        STATUS: {
            BADREQUEST: { title: "Unvollständige Daten", sub: "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." },
            NOTFOUND: { title: "Mitglied nicht gefunden", sub: "Das gewählte Mitglied wurde im System nicht gefunden." },
            CONFLICT: { title: "Speicher-Konflikt", sub: "Jemand anderes hat den Status des Mitglieds bereits bearbeitet. Bitte Seite aktualisieren, um die neuesten Daten zu sehen." },
            DEFAULT: { title: "Fehler beim Aktualisieren", sub: "Beim Aktualisieren des Mitglieds ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." }
        },
        CHECK: {
            DEFAULT: { title: "Mitglied wurde gelöscht", sub: "Dieses Mitglied wurde gelöscht und ist nicht mehr verfügbar." },
        }
    };

    const config = errorConfigs[context]?.[errorType] ?? errorConfigs[context]?.DEFAULT;

    if (!config) return;

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.sub,
        type: "error"
    });
}

const pendingChecks = new Map();

/**
 * Checks whether a member with the given ID exists in the system.
 *
 * Responsibilities:
 * - Prevents duplicate API calls by reusing an in-flight request (`pendingChecks`)
 * - Validates input (returns false if no ID is provided)
 * - Performs API request to verify existence
 * - Delegates global API errors to the global handler
 *
 * Behavior:
 * - Returns `false` if:
 *   - No ID is provided
 *   - The API responds with HTTP 404 (member does not exist)
 * - Returns `true` if:
 *   - The member exists (any non-404 successful response)
 *   - A global API error occurs (e.g. UNAUTHORIZED, NETWORK)
 *   - An unexpected exception is thrown
 *
 * Notes:
 * - Concurrent calls share the same promise via `pendingChecks`
 *   to avoid redundant network requests.
 * - Errors default to `true` to avoid blocking dependent flows
 *   (e.g. route guards or navigation logic).
 *
 * @async
 * @function memberExists
 * @param {string} id - ID of the member to check
 * @returns {Promise<boolean>} Whether the member exists or should be treated as existing
 */
export async function memberExists(id) {
    if (!id) return false;

    if (pendingChecks.has(id)) return await pendingChecks.get(id);

    isFetching.checkMember = true;

    const request = (async () => {
        try {
            const { resp } = await apiCheckMember(id);
            const normalized = normalizeResponse(resp);

            if (normalized.status === 404) return false;

            if (handleGlobalApiError(normalized)) return true;

            return true;
        } catch (e) {
            return true;
        } finally {
            pendingChecks.delete(id);
            if (pendingChecks.size === 0) {
                isFetching.checkMember = false;
            }
        }
    })();

    pendingChecks.set(id, request);
    return await request;
}

/**
 * Creates a new member in the system.
 *
 * Features:
 * - Prevents duplicate requests using `isFetching.newMember`
 * - Handles global API errors
 * - Handles domain-specific validation/conflict errors
 * - Displays success/error toasts
 *
 * @param {Object} member - Member data to create
 * @returns {Promise<void>}
 */
export async function newMember(member) {
    if (isFetching.newMember) return;
    isFetching.newMember = true;

    try {
        const { resp } = await apiAddMember(member);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!resp.ok) {
            handleMemberError(normalizedResponse.errorType, "ADD");
            return;
        }

        addToast({
            title: "Mitglied hinzugefügt",
            subTitle: viewport.isMobile ? "" : "Das neue Mitglied wurde erfolgreich im System hinzugefügt.",
            type: "success"
        });
    } finally {
        isFetching.newMember = false;
    }
}

/**
 * Deletes a member by ID.
 *
 * Features:
 * - Prevents duplicate requests using `isFetching.deleteMember`
 * - Handles global API errors
 * - Handles domain-specific deletion errors
 * - Displays success/error toasts
 *
 * @param {string} id - ID of the member to delete
 * @returns {Promise<void>}
 */
export async function removeMember(id) {
    if (isFetching.deleteMember) return;
    isFetching.deleteMember = true;

    try {
        const { resp } = await apiDeleteMember(id);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleMemberError(normalizedResponse.errorType, "DELETE");
            return;
        }

        addToast({
            title: "Mitglied gelöscht",
            subTitle: viewport.isMobile ? "" : "Das gewählte Mitglied wurde erfolgreich aus dem System gelöscht.",
            type: "success"
        });
    } finally {
        isFetching.deleteMember = false;
    }
}

/**
 * Toggles or updates the status of a member (e.g. active/inactive).
 *
 * Features:
 * - Prevents duplicate requests using `isFetching.updateStatus`
 * - Handles global API errors
 * - Handles domain-specific errors
 * - Displays success/error toasts
 *
 * @param {string} id - ID of the member whose status should be updated
 * @returns {Promise<void>}
 */
export async function switchMemberStatus(id) {
    if (isFetching.updateStatus) return;
    isFetching.updateStatus = true;

    try {
        const member = membersStore.raw.find(m => m.id === id);
        if (!member) {
            handleMemberError("NOTFOUND", "STATUS");
            return;
        }

        const { resp, body } = await apiUpdateMemberStatus(id, member.rev);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleMemberError(normalizedResponse.errorType, "STATUS");
            return;
        }

        const index = membersStore.raw.findIndex(m => m.id === id);
        if (index !== -1) {
            membersStore.raw[index] = {
                ...membersStore.raw[index],
                rev: body.rev
            };
        }

        addToast({
            title: "Mitgliedsstatus aktualisiert",
            subTitle: viewport.isMobile ? "" : "Der Status des Mitglieds wurde erfolgreich im System geändert.",
            type: "success"
        });
    } finally {
        isFetching.updateStatus = false;
    }
}

/**
 * Resets a member's password to a temporary value.
 *
 * Features:
 * - Prevents duplicate requests using `isFetching.resetPassword`
 * - Handles global API errors
 * - Handles domain-specific errors
 * - Displays success/error toasts
 *
 * @param {string} id - ID of the member
 * @returns {Promise<void>}
 */
export async function resetMemberPassword(id) {
    if (isFetching.resetPassword) return;
    isFetching.resetPassword = true;

    try {
        const { resp } = await apiResetMembersPassword(id);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleMemberError(normalizedResponse.errorType, "RESET");
            return;
        }

        addToast({
            title: "Passwort zurückgesetzt",
            subTitle: viewport.isMobile ? "" : "Das Passwort wurde erfolgreich auf ein temporäres Passwort zurückgesetzt.",
            type: "success"
        });
    } finally {
        isFetching.resetPassword = false;
    }
}

/**
 * Updates an existing member's data.
 *
 * Features:
 * - Prevents duplicate requests using `isFetching.updateMember`
 * - Handles global API errors
 * - Handles domain-specific validation errors
 * - Displays success/error toasts
 *
 * @param {Object} member - Updated member data
 * @returns {Promise<void>}
 */
export async function updateMember(member) {
    if (isFetching.updateMember) return;
    isFetching.updateMember = true;

    try {
        const { resp, body } = await apiUpdateMember(member);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleMemberError(normalizedResponse.errorType, "UPDATE");
            return;
        }

        Object.assign(user, { rev: body.rev_user });

        const index = membersStore.raw.findIndex(m => m.id === member.id);
        if (index !== -1) {
            membersStore.raw[index] = {
                ...membersStore.raw[index],
                ...member,
                rev: body.rev_member
            };
        }

        addToast({
            title: "Mitgliedsdaten aktualisiert",
            subTitle: viewport.isMobile ? "" : "Die Daten des Mitglieds wurden erfolgreich im System geändert.",
            type: "success"
        });
    } finally {
        isFetching.updateMember = false;
    }
}
import {
    apiAddMember,
    apiDeleteMember,
    apiResetMembersPassword,
    apiUpdateMember,
    apiUpdateMemberStatus
} from "../api/apiMembers.svelte";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte";
import { normalizeResponse } from "../api/http.svelte";
import { addToast } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";

export const roleMap = {
    "Mitglied": "member",
    "Vorstand": "board_member",
    "Schriftführer": "secretary",
    "Chorleitung": "conductor",
    "Notenwart": "librarian",
    "admin": "admin",
    "secretary": "Schriftführer",
    "board_member": "Vorstand",
    "member": "Mitglied",
    "conductor": "Chorleitung",
    "librarian": "Notenwart"
};

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
            DEFAULT: { title: "Fehler beim Hinzufügen", sub: "Beim Hinzufügen des neuen Mitglieds ist ein Fehler aufgetreten." }
        },
        UPDATE: {
            BADREQUEST: { title: "Unvollständige Daten", sub: "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." },
            NOTFOUND: { title: "Mitglied nicht gefunden", sub: "Das gewählte Mitglied wurde im System nicht gefunden." },
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
            DEFAULT: { title: "Fehler beim Aktualisieren", sub: "Beim Aktualisieren des Mitglieds ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." }
        }
    };

    const key = context === "ADD" && errorType === 409 ? "CONFLICT" : errorType;
    const config = (errorConfigs[context] && errorConfigs[context][key]) || errorConfigs[context].DEFAULT;

    addToast({
        title: config.title,
        subTitle: viewport.isMobile ? "" : config.sub,
        type: "error"
    });
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
        const { resp } = await apiUpdateMemberStatus(id);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleMemberError(normalizedResponse.errorType, "STATUS");
            return;
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
        const { resp } = await apiUpdateMember(member);
        const normalizedResponse = normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            handleMemberError(normalizedResponse.errorType, "UPDATE");
            return;
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
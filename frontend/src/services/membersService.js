import {
    apiAddMember,
    apiDeleteMember,
    apiResetMembersPassword,
    apiUpdateMember,
    apiUpdateMemberStatus
} from "../api/apiMembers";
import { handleGlobalApiError } from "../api/globalErrorHandler";
import { normalizeResponse } from "../api/http";
import { addToast } from "../stores/toasts";
import { viewport } from "../stores/viewport.svelte";

export const roleMap = {
    "Mitglied": "member",
    "Vorstand": "vorstand",
    "Schriftführer": "schriftführer",
    "Chorleitung": "chorleitung",
    "Notenwart": "notenwart",
    "admin": "admin",
    "schriftführer": "Schriftführer",
    "vorstand": "Vorstand",
    "member": "Mitglied",
    "chorleitung": "Chorleitung",
    "notenwart": "Notenwart"
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
 * Creates a new member in the system.
 *
 * Handles:
 * - Duplicate request prevention via internal `isFetching` guard.
 * - API call to create the member.
 * - Global API error delegation.
 * - Context-aware toast notifications (mobile vs. desktop).
 *
 * Error cases handled explicitly:
 * - 409 (email already exists)
 * - BADREQUEST (invalid payload)
 * - Generic fallback error
 *
 * On success, a success toast is displayed.
 *
 * @async
 * @function newMember
 * @param {*&{voice: *, status: *, role: *}} member - Member payload to persist.
 * @param {string} member.name - First name.
 * @param {string} member.surname - Last name.
 * @param {string} member.email - Unique email address.
 * @param {string} member.phone - Phone number.
 * @param {string} member.address - Address.
 * @param {string} member.voice - Voice identifier (mapped enum value).
 * @param {string} member.status - Status identifier (mapped enum value).
 * @param {string} member.role - Role identifier (mapped enum value).
 * @param {string|Date} member.birthday - Birthdate.
 * @param {string|Date} member.joined - Join date.
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
            if (normalizedResponse.status === 409)  {
                addToast({
                    title: "E-Mail-Adresse bereits verwendet",
                    subTitle: !viewport.isMobile ? "Die von Ihnen eingegebene E-Mail-Adresse ist bereits einem anderen Mitglied zugeordnet. Bitte wählen Sie eine andere E-Mail-Adresse aus." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Ungültige Daten",
                    subTitle: !viewport.isMobile ? "Bitte überprüfen Sie Ihre Eingaben. Einige Felder enthalten ungültige Werte." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Hinzufügen des Mitglieds",
                    subTitle: !viewport.isMobile ? "Beim Hinzufügen des neuen Mitglieds ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            }
            return;
        }

        addToast({
            title: "Mitglied hinzugefügt",
            subTitle: !viewport.isMobile ? "Das neue Mitglied wurde erfolgreich im System hinzugefügt." : "",
            type: "success"
        });
    } finally {
        isFetching.newMember = false;
    }
}

/**
 * Deletes a member from the system.
 *
 * Handles:
 * - Duplicate request prevention via `isFetching`.
 * - API deletion request.
 * - Global error delegation.
 * - Detailed error-specific toast messaging.
 *
 * Error cases handled explicitly:
 * - BADREQUEST (invalid or incomplete data)
 * - NOTFOUND (member does not exist)
 * - Generic fallback error
 *
 * On success, a confirmation toast is displayed.
 *
 * @async
 * @function removeMember
 * @param {string|number} id - Unique identifier of the member to delete.
 * @returns {Promise<void>}
 */
export async function removeMember(id){
    if (isFetching.deleteMember) return;
    isFetching.deleteMember = true;

    try {
        const { resp } = await apiDeleteMember(id);

        const normalizedResponse = normalizeResponse(resp);
        if (handleGlobalApiError(normalizedResponse)) return;

        if (!normalizedResponse.ok) {
            if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Unvollständige Daten",
                    subTitle: !viewport.isMobile ? "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Mitglied nicht gefunden",
                    subTitle: !viewport.isMobile ? "Das gewählte Mitglied wurde im System nicht gefunden." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim entfernen des Mitglieds",
                    subTitle: !viewport.isMobile ? "Beim entfernen des neuen Mitglieds ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            }

            return;
        }

        addToast({
            title: "Mitglied gelöscht",
            subTitle: !viewport.isMobile ? "Das gewählte Mitglied wurde erfolgreich aus dem System gelöscht." : "",
            type: "success"
        });
    } finally {
        isFetching.deleteMember = false;
    }
}

/**
 * Toggles the status of a member (e.g., active ↔ inactive).
 *
 * Handles:
 * - Duplicate request prevention.
 * - API call to update the member's status.
 * - Global API error delegation.
 * - Context-aware toast notifications.
 *
 * Error cases handled explicitly:
 * - BADREQUEST
 * - NOTFOUND
 * - Generic fallback error
 *
 * On success, a confirmation toast is displayed.
 *
 * @async
 * @function switchMemberStatus
 * @param {string|number} id - Unique identifier of the member.
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
            if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Unvollständige Daten",
                    subTitle: !viewport.isMobile ? "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Mitglied nicht gefunden",
                    subTitle: !viewport.isMobile ? "Das gewählte Mitglied wurde im System nicht gefunden." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Aktualisieren des Mitglieds",
                    subTitle: !viewport.isMobile ? "Beim Aktualisieren des Mitglieds ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            }

            return;
        }

        addToast({
            title: "Mitgliedsstatus aktualisiert",
            subTitle: !viewport.isMobile ? "Der Status des Mitglieds wurde erfolgreich im System geändert." : "",
            type: "success"
        });
    } finally {
        isFetching.updateStatus = false;
    }
}

/**
 * Resets the password of a specific member.
 *
 * The backend generates and assigns a temporary password.
 *
 * Handles:
 * - Duplicate request prevention.
 * - API password reset call.
 * - Global API error delegation.
 * - Error-specific and success toast feedback.
 *
 * Error cases handled explicitly:
 * - BADREQUEST
 * - NOTFOUND
 * - Generic fallback error
 *
 * On success, a confirmation toast is displayed.
 *
 * @async
 * @function resetMemberPassword
 * @param {string|number} id - Unique identifier of the member.
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
            if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Unvollständige Daten",
                    subTitle: !viewport.isMobile ? "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Mitglied nicht gefunden",
                    subTitle: !viewport.isMobile ? "Das gewählte Mitglied wurde im System nicht gefunden." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim Zurücksetzen des Passworts",
                    subTitle: !viewport.isMobile ? "Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            }

            return;
        }

        addToast({
            title: "Passwort zurückgesetzt",
            subTitle: !viewport.isMobile ? "Das Passwort des Mitglieds wurde erfolgreich auf ein temporären Passwort zurückgesetzt." : "",
            type: "success"
        });
    } finally {
        isFetching.resetPassword = false;
    }
}

/**
 * Updates the data of an existing member.
 *
 * Handles:
 * - Duplicate request prevention.
 * - API update request with full member payload.
 * - Global API error delegation.
 * - Context-aware toast notifications.
 *
 * Error cases handled explicitly:
 * - BADREQUEST (invalid payload)
 * - NOTFOUND (member does not exist)
 * - Generic fallback error
 *
 * On success, a confirmation toast is displayed.
 *
 * @async
 * @function updateMember
 * @param {Object} member - Complete member object containing updated values.
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
            if (normalizedResponse.errorType === "BADREQUEST") {
                addToast({
                    title: "Unvollständige Daten",
                    subTitle: !viewport.isMobile ? "Es wurden unvollständige Daten übermittelt. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            } else if (normalizedResponse.errorType === "NOTFOUND") {
                addToast({
                    title: "Mitglied nicht gefunden",
                    subTitle: !viewport.isMobile ? "Das gewählte Mitglied wurde im System nicht gefunden." : "",
                    type: "error"
                });
            } else {
                addToast({
                    title: "Fehler beim bearbeiten der Mitgliedsdaten",
                    subTitle: !viewport.isMobile ? "Beim bearbeiten der Mitgliedsdaten ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." : "",
                    type: "error"
                });
            }

            return;
        }

        addToast({
            title: "Mitgliedsdaten aktualisiert",
            subTitle: !viewport.isMobile ? "Die Daten des Mitglieds wurden erfolgreich im System geändert." : "",
            type: "success"
        });
    } finally {
        isFetching.updateMember = false;
    }
}
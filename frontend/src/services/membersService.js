import { addMember, deleteMember, updateMemberStatus } from "../api/apiMembers";
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
};

/**
 * Adds a new member to the system.
 *
 * Required fields on the `member` object:
 * - `name` (string): First name of the member.
 * - `surname` (string): Last name of the member.
 * - `email` (string): Email address of the member.
 * - `phone` (string): Phone number of the member.
 * - `address` (string): Physical address of the member.
 * - `voice` (string): Voice part or category (e.g., for choirs or roles).
 * - `status` (string): Status of the member (e.g., active, inactive).
 * - `role` (string): Role of the member in the organization.
 * - `birthday` (string or Date): Birthdate of the member.
 * - `joined` (string or Date): Date the member joined.
 *
 * This function handles API interaction, including:
 * - Preventing duplicate requests (`isFetching` flag).
 * - Handling global API errors.
 * - Showing toasts for success or specific errors (e.g., email conflicts).
 *
 * @param {Object} member - Object containing all required member fields.
 */
export async function newMember(member) {
    if (isFetching.newMember) return;
    isFetching.newMember = true;

    console.log(viewport.isMobile);

    try {
        const { resp } = await addMember(member);

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

export async function removeMember(id){
    if (isFetching.deleteMember) return;
    isFetching.deleteMember = true;

    try {
        const { resp } = await deleteMember(id);

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

export async function switchMemberStatus(id) {
    if (isFetching.updateStatus) return;
    isFetching.updateStatus = true;

    try {
        const { resp } = await updateMemberStatus(id);

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
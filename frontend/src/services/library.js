import { get } from "svelte/store";
import { appSettings } from "../stores/appSettings.svelte.js";
import { loadAppSettings } from "./appSettingsSyncService.svelte";
import { auth } from "../stores/auth.svelte.js";
import { addToast } from "../stores/toasts.svelte";
import { logout } from "./userService.svelte";
import { push } from "svelte-spa-router";
import { libraryStore } from "../stores/library.svelte";

// @ts-ignore
const apiUrl = __API_URL__;

export async function addScore(scoreData) {
    const formData = new FormData();

    formData.append("title", scoreData.title);
    formData.append("artist", scoreData.artist);
    formData.append("type", scoreData.type);
    formData.append("voices", JSON.stringify(scoreData.voices));
    formData.append("voiceCount", String(scoreData.voiceCount));

    for (const file of scoreData.files) {
        formData.append("files", file, file.name);
    }

    const resp = await fetch(`${apiUrl}/library/new`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${get(auth).token}`,
        },
        body: formData,
    });

    if (resp.status === 200) {
        addToast({
            title: "Noten hinzugefügt",
            subTitle:
                "Die Noten wurden erfolgreich zur Notenbibliothek hinzugefügt.",
            type: "success",
        });
    } else if (resp.status === 400) {
        addToast({
            title: "Ungültige Daten",
            subTitle:
                "Einige der von Ihnen eingegebenen Daten sind fehlerhaft. Bitte prüfen Sie Ihre Eingabe und versuchen Sie es erneut.",
            type: "error",
        });
    } else if (resp.status === 409) {
        addToast({
            title: "Noten bereits vorhanden",
            subTitle:
                "Es existiert bereits ein Eintrag mit diesem Titel und Künstler in der Notenbibliothek.",
            type: "error",
        });
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle:
                "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error",
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle:
                "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error",
        });
    }
}

export async function updateScore(scoreData) {
    const formData = new FormData();

    formData.append("id", scoreData.id);
    formData.append("title", scoreData.title);
    formData.append("artist", scoreData.artist);
    formData.append("type", scoreData.type);
    formData.append("voices", JSON.stringify(scoreData.voices));
    formData.append("voiceCount", String(scoreData.voiceCount));
    
    const newFiles = [];
    const existingFileNames = [];

    for (const f of scoreData.files) {
        if (f instanceof File) {
            newFiles.push(f);
        } else if (typeof f === "string") {
            existingFileNames.push(f);
        } else {
            addToast({
                title: "Ungültige Datei",
                subTitle: "Beim lesen einer Datei ist ein Fehler aufgetreten.",
                type: "error",
            });
        }
    }

    const removedFiles = scoreData.originalFiles.filter(f => !existingFileNames.includes(f));

    formData.append("removedFiles", removedFiles);

    for (const file of newFiles) {
        formData.append("files", file, file.name);
    }

    const resp = await fetch(`${apiUrl}/library/update`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${get(auth).token}`,
        },
        body: formData,
    });

    if (resp.status === 200) {
        addToast({
            title: "Änderungen gespeichert",
            subTitle: "Die Änderungen am Notenmaterial erfolgreich in der Notenbibliothek gespeichert.",
            type: "success",
        });
    } else if (resp.status === 400) {
        addToast({
            title: "Ungültige Daten",
            subTitle: "Einige der von Ihnen eingegebenen Daten sind fehlerhaft. Bitte prüfen Sie Ihre Eingabe und versuchen Sie es erneut.",
            type: "error",
        });
    } else if (resp.status === 404) {
        addToast({
            title: "Noten nicht gefunden",
            subTitle: "Das von ihnen bearbeitete Notenmaterial konnte nicht gefunden werden. Bitte versuchen Sie es erneut.",
            type: "error",
        });
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error",
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error",
        });
    }
}

export async function deleteScore(scoreId) {
    return await fetch(`${apiUrl}/library/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${get(auth).token}`,
        },
        body: JSON.stringify({ id: scoreId }),
    });
}

export async function downloadScoreFiles(scoreId) {
    const resp = await fetch(`${apiUrl}/library/${scoreId}/files`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${get(auth).token}`,
        },
    });

    let body = null;

    if (!resp.ok) {
        try {
            body = await resp.json();
        } catch {
            body = null;
        }
    }

    if (resp.status === 200) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "Noten.zip";
        a.click();
        
        addToast({
            title: "Download erfolgreich",
            subTitle:
            "Die Noten wurden erfolgreich aus der Notenbibliothek gedownloaded.",
            type: "success",
        });

        URL.revokeObjectURL(url);
    } else if (resp.status === 404) {
        if (body.errorMessage === "ScoreNotFound") {
            addToast({
                title: "Noten nicht gefunden",
                subTitle:
                    "Die Noten wurden in der Notenbibliothek nicht gefunden.",
                type: "error",
            });
        } else if (body.errorMessage === "NoFilesFound") {
            addToast({
                title: "Keine Dateien gefunden",
                subTitle: "Es sind keine Dateien für diese Noten hinterlegt.",
                type: "info",
            });
        } else {
            addToast({
                title: "Unerwarteter Fehler",
                subTitle: "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
                type: "error"
            });
        }
        return;
    } else if (resp.status === 400) {
        addToast({
            title: "Ungültige Daten",
            subTitle:
                "Es wurden fehlerhafte Daten übermittelt. Bitte versuchen Sie es später erneut.",
            type: "error",
        });
        return;
    } else if (resp.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle:
                "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error",
        });
        logout();
        await push("/?cpwErr=false");
        return;
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle:
                "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error",
        });
        return;
    }
}

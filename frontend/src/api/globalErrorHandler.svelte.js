import { addToast } from "../stores/toasts.svelte";
import { viewport } from "../stores/viewport.svelte";

export function handleGlobalApiError(result) {
    if (result.ok) return false;

    switch (result.errorType) {
        case "UNAUTHORIZED":
            addToast({
                title: "Ungültiges Token",
                subTitle: !viewport.isMobile ? "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten." : "",
                type: "error"
            });
            return true;
        case "SERVER":
            addToast({
                title: "Interner Serverfehler",
                subTitle: !viewport.isMobile ? "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut." : "",
                type: "error"
            });
            return true;
        case "NETWORK":
            addToast({
                title: "Keine Verbindung zum Server",
                subTitle: !viewport.isMobile ? "Es konnte keine Verbindung zum Server aufgebaut werden. Bitte versuchen Sie es später erneut." : "",
                type: "error"
            });
            return true;
    }

    return false;
}
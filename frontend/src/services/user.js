import { clearValue } from "./store";
import { get } from "svelte/store";
import { push } from "svelte-spa-router";
import { user } from "../stores/user";
import { auth } from "../stores/auth";
import { addToast } from "../stores/toasts";

const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

export async function getData(email, token) {
    return await fetch(`${apiUrl}/user/data`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email })
    });
}

export async function loadUserData() {
    const userStore = get(user);
    const authStore = get(auth);

    // Get user data
    const response = await getData(userStore.email, authStore.token);
    const body = await response.json();

    if (response.status === 200) {
        user.update(u => ({ ...u, name: body.name, email: body.email, role: body.role, address: body.address, phone: body.phone, loaded: true }));
    } else if (response.status === 401) {
        // Auth token invalid / unauthorized
        addToast({
            title: "Ungültiges Token",
            subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
            type: "error"
        });
        logout();
        await push("/?cpwErr=false");
    } else if (response.status === 404) {
        // user not found route back to log in
        addToast({
            title: "Konto nicht gefunden",
            subTitle: "Ihr Konto konnte nicht gefunden werden. Bitte melden Sie sich erneut an, um fortzufahren.",
            type: "error"
        });
        logout();
        await push("/?cpwErr=false");
    } else {
        // internal server error / unknown error
        addToast({
            title: "Interner Serverfehler",
            subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
            type: "error"
        });
    }
}

export async function updateData(originalEmail) {
    const currentUser = get(user);
    const currentAuth = get(auth);

    return await fetch(`${apiUrl}/user/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentAuth.token}`
        },
        body: JSON.stringify({
            originalEmail: originalEmail,
            email: currentUser.email,
            name: currentUser.name,
            phone: currentUser.phone,
            address: currentUser.address
        })
    });
}

export function logout() {
    user.set({
        name: "",
        email: "",
        role: "",
        loaded: false
    });

    // remove auth token
    auth.set({ token: "" });
    clearValue("authToken");
}
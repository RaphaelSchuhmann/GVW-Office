import { clearValue } from "./store";
import { get } from "svelte/store";
import { user } from "../stores/user";
import { auth } from "../stores/auth";

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
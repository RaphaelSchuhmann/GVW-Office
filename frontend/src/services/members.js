import { get } from "svelte/store";
import { auth } from "../stores/auth";

export const roleMap = {
    "Mitglied": "member",
    "Vorstand": "vorstand",
    "Schriftführer": "schriftführer",
    "admin": "admin"
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

const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

export async function addMember(name, surname, email, phone, address, voice, status, role, birthday, joined) {
    const token = get(auth).token;
    return await fetch(`${apiUrl}/members/add`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, surname, email, phone, address, voice, status, role, birthdate: birthday, joined })
    });
}

export async function updateMember(id, name, surname, email, phone, address, voice, status, role, birthday, joined) {
    const token = get(auth).token;
    return await fetch(`${apiUrl}/members/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, name, surname, email, phone, address, voice, status, role, birthdate: birthday, joined })
    });
}

export async function updateStatus(id) {
    const token = get(auth).token;
    return await fetch(`${apiUrl}/members/update/status`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
    });
}

export async function deleteMember(id) {
    const token = get(auth).token;
    return await fetch(`${apiUrl}/members/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
    });
}
import { get } from "svelte/store";
import { auth } from "../stores/auth";

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

const apiUrl = __API_URL__;

/**
 * Adds a new member to the system
 * @param {string} name - Member's first name
 * @param {string} surname - Member's last name
 * @param {string} email - Member's email address
 * @param {string} phone - Member's phone number
 * @param {string} address - Member's address
 * @param {string} voice - Member's voice type (tenor1, tenor2, bass1, bass2)
 * @param {string} status - Member's status (active, inactive)
 * @param {string} role - Member's role (member, vorstand, schriftführer, admin)
 * @param {string} birthday - Member's birthday in DD.MM.YYYY format
 * @param {string} joined - Date member joined in DD.MM.YYYY format
 * @returns {Promise<Response>} API response with creation result
 */
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

/**
 * Updates an existing member's information
 * @param {string} id - Member's ID
 * @param {string} name - Member's first name
 * @param {string} surname - Member's last name
 * @param {string} email - Member's email address
 * @param {string} phone - Member's phone number
 * @param {string} address - Member's address
 * @param {string} voice - Member's voice type (tenor1, tenor2, bass1, bass2)
 * @param {string} status - Member's status (active, inactive)
 * @param {string} role - Member's role (member, vorstand, schriftführer, admin)
 * @param {string} birthday - Member's birthday in DD.MM.YYYY format
 * @param {string} joined - Date member joined in DD.MM.YYYY format
 * @returns {Promise<Response>} API response with update result
 */
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

/**
 * Toggles a member's status between active and inactive
 * @param {string} id - Member's ID
 * @returns {Promise<Response>} API response with status update result
 */
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

/**
 * Resets a member's password to default
 * @param {string} id - Member's ID
 * @returns {Promise<Response>} API response with password reset result
 */
export async function resetPassword(id) {
    const token = get(auth).token;
    return await fetch(`${apiUrl}/user/reset/password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ memberId: id })
    });
}

/**
 * Deletes a member from the system
 * @param {string} id - Member's ID to delete
 * @returns {Promise<Response>} API response with deletion result
 */
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
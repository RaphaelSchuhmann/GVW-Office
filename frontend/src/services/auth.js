const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

export async function login(email, password) {
    return await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password })
    });
}

export async function changePw(oldPw, newPw, email) {
    return await fetch(`${apiUrl}/auth/changePw`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, oldPw, newPw })
    });
}

export async function authenticate(token) {
    return await fetch(`${apiUrl}/auth/auto`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}
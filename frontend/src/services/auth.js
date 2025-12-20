const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

export async function login(email, password) {
    const resp = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password })
    });

    return resp.json();
}

export async function changePw(oldPw, newPw, email) {
    const resp = await fetch(`${apiUrl}/auth/changePw`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ oldPw, newPw, email })
    });

    return resp.json();
}

export async function authenticate(token) {
    const resp = await fetch(`${apiUrl}/auth/auto`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return resp.json();
}
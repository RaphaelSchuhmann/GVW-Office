const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

export async function login(email, password) {
    const resp = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password })
    });

    if (!resp.ok) throw new Error(`Login failed: ${resp.statusText}`);
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

    if (!resp.ok) throw new Error(`Password change failed: ${resp.statusText}`);
    return resp.json();
}

export async function authenticate(token) {
    const resp = await fetch(`${apiUrl}/auth/auto`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!resp.ok) throw new Error(`Authentication failed: ${resp.statusText}`);
    return resp.json();
}
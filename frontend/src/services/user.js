const apiUrl = import.meta.env.DEV_API_URL || "http://localhost:3500";

export async function getData(email, token) {
    return await fetch(`${apiUrl}/user/data`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email })
    });
}
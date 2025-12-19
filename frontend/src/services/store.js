export function setValue(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (err) {
        console.error("setValue failed: ", err);
    }
}

export function getValue(key) {
    try {
        const value = localStorage.getItem(key);
        return value ?? "";
    } catch (err) {
        console.error("getValue failed: ", err);
        return "";
    }
}

export function clearValue(key) {
    try {
        localStorage.removeItem(key);
    } catch (err) {
        console.error("clearValue failed: ", err);
    }
}
import { writable } from "svelte/store";

export const toasts = writable([]);

export function addToast({ title, subTitle, type = "info", timeout = 5000 }) {
    const id = crypto.randomUUID();

    toasts.update(t => [...t, { id: id, title: title, subTitle: subTitle, type: type }]);

    setTimeout(() => {
        toasts.update(t => t.filter(t => t.id !== id));
    }, timeout);
}

export function removeToast(id) {
    toasts.update(t => t.filter(toast => toast.id !== id));
}
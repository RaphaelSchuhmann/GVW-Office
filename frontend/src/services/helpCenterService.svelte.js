import {
    apiAddArticle,
    apiAddCategory, apiCheckArticle, apiCheckCategory, apiDeleteArticle, apiDeleteCategory, apiGetArticle,
    apiGetArticles, apiSearchArticles, apiUpdateArticle,
    apiUpdateFeaturedCategories
} from "../api/apiHelpCenter.svelte.js";
import { handleGenericErrors, handleGlobalApiError } from "../api/globalErrorHandler.svelte.js";
import { normalizeResponse } from "../api/http.svelte.js";
import { addToast } from "../stores/toasts.svelte.js";
import { viewport } from "../stores/viewport.svelte.js";
import { appSettings } from "../stores/appSettings.svelte.js";
import { helpCenterStore } from "../stores/helpCenterStore.svelte.js";
import { pendingImages } from "./textEditorService.svelte.js";

const isFetching = {
    addCategory: false,
    deleteCategory: false,
    updatedFeatured: false,
    addArticle: false,
    deleteArticle: false,
    updateArticle: false,
    getArticle: false,
    checkCategory: false,
    checkArticle: false,
    searchArticle: false,
};

const pendingCategoryChecks = new Map();
const pendingArticleChecks = new Map();
const pendingArticleSearch = new Map();

export async function addHelpCenterCategory(inputs) {
    if (isFetching.addCategory) return false;

    try {
        const { resp, body } = await apiAddCategory(inputs);
        const normalizedResp = await normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResp)) return;

        if (!body.rev) {
            handleGenericErrors({ ok: false, message: "0000500", errorType: "SERVER" });
            return;
        }

        appSettings.rev = body.rev;

        addToast({
            title: "Kategorie hinzugefügt",
            subTitle: viewport.isMobile ? "" : "Kategorie wurde erfolgreich hinzugefügt.",
            type: "success"
        });
    } finally {
        isFetching.addCategory = false;
    }
}

export async function updateHelpCenterCategoryFeaturedList(featured) {
    if (isFetching.updatedFeatured || featured.size <= 0) return;

    isFetching.updatedFeatured = true;

    try {
        const { resp, body } = await apiUpdateFeaturedCategories(featured);
        const normalizedResp = await normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResp)) return;

        if (!body.rev) {
            handleGenericErrors({ ok: false, message: "0000500", errorType: "SERVER" });
            return;
        }

        appSettings.rev = body.rev;

        addToast({
            title: "Änderungen gespeichert",
            subTitle: viewport.isMobile ? "" : "Featured Kategorien wurde erfolgreich gespeichert.",
            type: "success"
        });
    } finally {
        isFetching.updatedFeatured = false;
    }
}

export async function deleteHelpCenterCategory(id) {
    if (isFetching.deleteCategory || !id) return;

    isFetching.deleteCategory = true;

    try {
        const category = appSettings.helpCenterCategories.find(cat => cat.id === id);

        if (!category || category.articleCount > 0) return;

        const { resp } = await apiDeleteCategory(id);
        const normalizedResp = await normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResp)) return;

        addToast({
            title: "Kategorie gelöscht",
            subTitle: viewport.isMobile ? "" : "Kategorie wurde erfolgreich gelöscht.",
            type: "success"
        });
    } finally {
        isFetching.deleteCategory = false;
    }
}

export async function addHelpCenterArticle(data) {
    if (isFetching.addArticle) return;

    isFetching.addArticle = true;

    try {
        data.category = $state.snapshot(helpCenterStore.activeCategory);

        const { resp, body } = await apiAddArticle(data);
        const normalizedResp = await normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResp)) return;

        if (!body.rev) return;

        appSettings.rev = body.rev;

        addToast({
            title: "Artikel angelegt",
            subTitle: viewport.isMobile ? "" : "Neuer Artikel wurde erfolgreich angelegt.",
            type: "success"
        });
    } finally {
        isFetching.addArticle = false;
    }
}

export async function getArticles() {
    if (!helpCenterStore.activeCategory) return;

    const { resp, body } = await apiGetArticles(helpCenterStore.activeCategory);
    const normalizedResp = await normalizeResponse(resp);

    if (handleGlobalApiError(normalizedResp)) return;

    if (!body.articles) return;

    helpCenterStore.articles = body.articles;
}

export async function getArticle(id) {
    if (isFetching.getArticle || !id) return;

    isFetching.getArticle = true;

    try {
        const { resp, body } = await apiGetArticle(id);
        const normalizedResp = await normalizeResponse(resp);

        if (handleGlobalApiError(normalizedResp)) return;

        helpCenterStore.activeArticle = body;
    } finally {
        isFetching.getArticle = false;
    }
}

export async function updateHelpCenterArticle(data) {
    if (isFetching.updateArticle) return data.rev || "";

    isFetching.updateArticle = true;

    try {
        const formData = new FormData();

        formData.append("articleData", new Blob([
            JSON.stringify({
                id: data.id,
                rev: data.rev,
                title: data.title,
                content: data.content,
            })
        ], {
            type: "application/json"
        }));

        const images = pendingImages.values();

        for (const item of images) {
            formData.append("files", item, item.name);
        }

        const { resp, body } = await apiUpdateArticle(formData);
        const normalized = normalizeResponse(resp);

        if (handleGlobalApiError(normalized)) return data.rev;
        if (!body.rev || body.rev === "") return data.rev;

        addToast({
            title: "Artikel aktualisiert",
            subTitle: viewport.isMobile ? "" : "Der Artikel wurde erfolgreich aktualisiert.",
            type: "success"
        });

        return body.rev;
    } finally {
        isFetching.updateArticle = false;
    }
}

export async function categoryExists(id) {
    if (!id) return false;

    if (pendingCategoryChecks.has(id)) return await pendingCategoryChecks.get(id);

    isFetching.checkCategory = true;

    const request = (async () => {
        try {
            const { resp } = await apiCheckCategory(id);
            const normalized = normalizeResponse(resp);

            if (normalized.status === 404) return false;

            if (handleGenericErrors(normalized)) return true;

            return true;
        } catch (e) {
            return true;
        } finally {
            pendingCategoryChecks.delete(id);
            if (pendingCategoryChecks.size === 0) {
                isFetching.checkCategory = false;
            }
        }
    })();

    pendingCategoryChecks.set(id, request);
    return await request;
}

export async function articleExists(id) {
    if (!id) return false;

    if (pendingArticleChecks.has(id)) return await pendingArticleChecks.get(id);

    isFetching.checkArticle = true;

    const request = (async () => {
        try {
            const { resp } = await apiCheckArticle(id);
            const normalized = normalizeResponse(resp);

            if (normalized.status === 404) return false;

            if (handleGenericErrors(normalized)) return true;

            return true;
        } catch (e) {
            return true;
        } finally {
            pendingArticleChecks.delete(id);
            if (pendingCategoryChecks.size === 0) {
                isFetching.checkArticle = false;
            }
        }
    })();

    pendingArticleChecks.set(id, request);
    return await request;
}

export async function deleteArticle(id) {
    if (isFetching.deleteArticle) return;

    isFetching.deleteArticle = true;

    try {
        const { resp } = await apiDeleteArticle(id);
        const normalized = normalizeResponse(resp);

        if (handleGlobalApiError(normalized)) return;

        addToast({
            title: "Artikel gelöscht",
            subTitle: viewport.isMobile ? "" : "Artikel wrude erfolgreich gelöscht.",
            type: "success"
        });
    } finally {
        isFetching.deleteArticle = false;
    }
}

export async function searchArticles(query) {
    if (pendingArticleSearch.has(query)) return await pendingArticleSearch.get(query);

    isFetching.searchArticles = true;

    const request = (async () => {
        try {
            const { resp, body } = await apiSearchArticles(query);
            const normalized = normalizeResponse(resp);

            if (handleGlobalApiError(normalized)) return;

            // If there is no data array just display nothing found
            if (!Array.isArray(body?.data)) {
                return [];
            }

            return body.data;
        } finally {
            pendingArticleSearch.delete(query);
            if (pendingArticleSearch.size === 0) {
                isFetching.searchArticles = false;
            }
        }
    })();

    pendingArticleSearch.set(query, request);
    return await request;
}
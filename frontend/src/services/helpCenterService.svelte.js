import {
    apiAddArticle,
    apiAddCategory, apiDeleteCategory,
    apiGetArticles,
    apiUpdateFeaturedCategories
} from "../api/apiHelpCenter.svelte.js";
import { handleGenericErrors, handleGlobalApiError } from "../api/globalErrorHandler.svelte.js";
import { normalizeResponse } from "../api/http.svelte.js";
import { addToast } from "../stores/toasts.svelte.js";
import { viewport } from "../stores/viewport.svelte.js";
import { appSettings } from "../stores/appSettings.svelte.js";
import { helpCenterStore } from "../stores/helpCenterStore.svelte.js";

const isFetching = {
    addCategory: false,
    deleteCategory: false,
    updatedFeatured: false,
    addArticle: false,
    deleteArticle: false,
    updateArticle: false
};

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
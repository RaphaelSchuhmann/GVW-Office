import { normalizeResponse } from "../api/http.svelte.js";
import { apiGetDocumentImage } from "../api/apiTextEditor.svelte.js";
import { editorMetadataStore } from "../stores/textEditorStore.svelte.js";

export const blockTypes = new Set(["text", "image", "file", "blockquote", "h1", "h2", "h3", "h4"]);

// k: image name / temp id, v: file
export const pendingImages = new Map();
// k: image name / temp id, v: blobUrl
export const previewUrls = new Map();

export function addBlock(items, index, content, type, insertAtIndex = false) {
    if (index < 0 && items.length > 0 || index === -1) return;

    if (!blockTypes.has(type)) return;

    const id = crypto.randomUUID();

    const block = {
        id: id,
        type: type,
        data: content,
    };

    if (items.length === 0) {
        items.push(block);
        return id;
    }

    insertAtIndex ? items.splice(index, 0, block) : items.splice(index + 1, 0, block);

    return id;
}

export function updateBlockType(blockId, type, items) {
    if (!type || !blockTypes.has(type) || !blockId || items.length === 0) return;

    const index = items.findIndex(i => i.id === blockId);
    if (index === -1) return;

    // If the type is "blockquote" and the current type of the block
    // already is block quote it should just toggle back to "text"
    // as some users might expect that to happen.
    if (type === "blockquote" && items[index].type === type) {
        items[index].type = "text";
        return blockId;
    }

    items[index].type = type;
    return blockId;
}

export function deleteBlock(items, blockId, isImage = false) {
    if (!blockId) return;

    const index = items.findIndex(i => i.id === blockId);
    const block = items.find(i => i.id === blockId);
    if (!block) return;

    if (isImage) {
        const blockData = block.data;

        if (previewUrls.has(blockData)) {
            previewUrls.delete(blockId);
        }

        if (pendingImages.has(blockData)) {
            pendingImages.delete(blockId);
        }
    }

    items.splice(index, 1);
}

export function insertImageBlock(file, items, insertAfterIndex) {
    const tempId = `temp_${crypto.randomUUID()}.${file.name.split('.').pop()}`;

    pendingImages.set(tempId, file);
    previewUrls.set(tempId, URL.createObjectURL(file));

    const block = {
        id: crypto.randomUUID(),
        type: "image",
        data: tempId
    };

    if (items.length === 0) {
        items.push(block);
        return;
    }

    items.splice(insertAfterIndex + 1, 0, block);
}

export function bulkInsertImageBlocks(images, items, insertAfterIndex) {
    const newBlocks = [];

    for (const file of images) {
        const tempId = `temp_${crypto.randomUUID()}.${file.name.split('.').pop()}`;

        pendingImages.set(tempId, file);
        previewUrls.set(tempId, URL.createObjectURL(file));

        const block = {
            id: crypto.randomUUID(),
            type: "image",
            data: tempId
        };

        newBlocks.push(block);
    }
    items.splice(insertAfterIndex + 1, 0, ...newBlocks);
}

let isFetching = {
    getImage: false
}

const pendingDocumentImages = new Set();

export async function getDocumentImage(documentId, imageId) {
    if (!documentId || !imageId) return;

    if (pendingDocumentImages.has(imageId)) return;

    pendingDocumentImages.add(imageId);

    isFetching.getImage = true;

    try {
        const { resp, blob } = await apiGetDocumentImage(editorMetadataStore.activeFeature, documentId, imageId);
        const normalizedResp = normalizeResponse(resp);

        if (!normalizedResp.ok) return null;

        return URL.createObjectURL(blob);
    } catch (e) {
        return null;
    } finally {
        isFetching.getImage = false;
        pendingDocumentImages.delete(imageId);
    }
}

export function applyStyleInDOM(action) {
    if (!action) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    if (action === "strong" || action === "b") {
        document.execCommand("bold", false, null);
    } else if (action === "em" || action === "i") {
        document.execCommand("italic", false, null);
    } else if (action === "u") {
        document.execCommand("underline", false, null);
    }
}
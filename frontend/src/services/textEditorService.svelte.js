import { normalizeResponse } from "../api/http.svelte.js";
import { apiGetDocumentImage, apiResolveURl } from "../api/apiTextEditor.svelte.js";
import { editorMetadataStore } from "../stores/textEditorStore.svelte.js";
import { handleGlobalApiError } from "../api/globalErrorHandler.svelte.js";
import { renameFile } from "./utils.js";

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

    const renamedFile = renameFile(file, tempId);
    console.log(renamedFile);
    pendingImages.set(tempId, renamedFile);
    previewUrls.set(tempId, URL.createObjectURL(renamedFile));

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
    console.log("getDocumentImage start", imageId);

    if (!documentId || !imageId) return null;

    if (pendingDocumentImages.has(imageId)) {
        console.log("deduped", imageId);
        return null;
    }

    pendingDocumentImages.add(imageId);

    try {
        const { resp, blob } = await apiGetDocumentImage(
            editorMetadataStore.activeFeature,
            documentId,
            imageId
        );

        console.log("api returned", {
            status: resp?.status,
            hasBlob: !!blob
        });

        const normalizedResp = normalizeResponse(resp);

        if (!normalizedResp.ok) {
            console.log("normalized not ok");
            return null;
        }

        const url = URL.createObjectURL(blob);

        console.log("returning url", url);

        return url;
    } finally {
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

export async function handleAutoLink(e, currentBlock, onDataSync) {
    if (e.key !== " " && e.key !== "Enter") return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType !== Node.TEXT_NODE) return;

    const text = textNode.nodeValue;
    const cursorOffset = range.startOffset;

    const words = text.slice(0, cursorOffset).split(/\s+/);
    const lastWord = words[words.length - 1];

    const urlPattern = /^(https?:\/\/[^\s]+)$/i;

    if (urlPattern.test(lastWord)) {
        e.preventDefault();
        const startOffset = cursorOffset - lastWord.length;
        const replaceRange = document.createRange();
        replaceRange.setStart(textNode, startOffset);
        replaceRange.setEnd(textNode, cursorOffset);

        selection.removeAllRanges();
        selection.addRange(replaceRange);

        const completeUrl = lastWord.trim();

        const urlData = await resolveURL(completeUrl);

        const richLinkHtml = `
            <a href="${completeUrl}" target="_blank" contenteditable="false" class="inline-flex items-center gap-2 bg-gv-light-bg border border-gv-border px-3 py-1 rounded-md text-gv-toast-info select-all mx-1 my-0.5 pointer-events-auto hover:underline" data-rich-link="true">
                ${urlData.favicon === "icon" ? `<span class=\"material-symbols-rounded text-sm\">link</span>` : `<img src="${urlData.favicon}" class=\"w-5 h-5 object-contain\" alt=\"\"/>`} 
                <span class="text-dt-7 font-medium">${urlData.title}</span>
            </a>&nbsp;`;

        document.execCommand("insertHTML", false, richLinkHtml);
        onDataSync(currentBlock.innerHTML);
    }
}

export async function resolveURL(url) {
    if (!url) return { title: url, favicon: "icon" };

    const { resp, body } = await apiResolveURl(url);
    const normalized = normalizeResponse(resp);

    if (handleGlobalApiError(normalized)) return { title: url, favicon: "icon" };

    return { title: body.title || url, favicon: body.favicon || "icon" };
}
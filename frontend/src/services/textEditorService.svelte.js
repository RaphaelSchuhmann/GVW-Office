import { editorSelectionStore } from "../stores/textEditorSelection.svelte.js";

const tagMap = {
    BOLD_OPEN: "**>",
    BOLD_CLOSE: "<**",
    ITALIC_OPEN: "//>",
    ITALIC_CLOSE: "<//",
    UNDERLINE_OPEN: "__>",
    UNDERLINE_CLOSE: "<__"
};

export function renderToHTML(text) {
    const tokens = tokenize(text);
    let html = "";
    let rawCursor = 0;

    tokens.forEach(token => {
        if (token.type === "TEXT") {
            html += `<span data-index="${rawCursor}">${token.raw}</span>`;
            rawCursor += token.raw.length;
        } else {
            if (token.style === "BOLD") html += token.type === "OPEN" ? "<strong>" : "</strong>";
            if (token.style === "ITALIC") html += token.type === "OPEN" ? "<em>" : "</em>";
            if (token.style === "UNDERLINE") html += token.type === "OPEN" ? "<u>" : "</u>";

            rawCursor += token.raw.length;
        }
    });

    return html;
}

export function convertHTMLToRaw(html) {
    return html
        .replace(/<span[^>]*>/g, "") // Strip the helper spans
        .replace(/<\/span>/g, "")
        .replace(/<strong>|<b>/g, "**>")
        .replace(/<\/strong>|<\/b>/g, "<**")
        .replace(/<em>|<i>/g, "//>")
        .replace(/<\/em>|<\/i>/g, "<//")
        .replace(/<u>/g, "__>")
        .replace(/<\/u>/g, "<__");
}

export function wrapSelection(content, action) {
    const { selection, domNode } = editorSelectionStore;
    const { itemId, startOffset, endOffset } = selection;
    if (!itemId) return;

    const targetIndex = content.findIndex(item => item.id === itemId);
    if (targetIndex === -1) return;

    if (content[targetIndex].type === "image") return;

    const originalText = content[targetIndex].data;

    const tokens = parseActiveStyles(tokenize(originalText));

    // Strip marker tokens
    const textTokens = stripMarkerTokens(tokens);

    const updatedTokens = applyStyleToSelection(textTokens, startOffset, endOffset, action);
    const finalTokens = insertMarkerTokens(updatedTokens);

    content[targetIndex].data = convertTokensToString(finalTokens);
    content[targetIndex].version += 1;
}

function tokenize(rawText) {
    const tagRegex = /(\*\*>|<\*\*|\/\/>|<\/\/|__>|<__)/g;

    const parts = rawText.split(tagRegex);

    let index = 0;
    return parts.map(part => {
        const startIndex = index === 0 ? index : index;
        const endIndex = index + part.length - 1;
        index = index + part.length;

        if (part === "**>") return { type: "OPEN", style: "BOLD", raw: part, start: startIndex, end: endIndex };
        if (part === "<**") return { type: "CLOSE", style: "BOLD", raw: part, start: startIndex, end: endIndex };
        if (part === "//>") return { type: "OPEN", style: "ITALIC", raw: part, start: startIndex, end: endIndex };
        if (part === "<//") return { type: "CLOSE", style: "ITALIC", raw: part, start: startIndex, end: endIndex };
        if (part === "__>") return { type: "OPEN", style: "UNDERLINE", raw: part, start: startIndex, end: endIndex };
        if (part === "<__") return { type: "CLOSE", style: "UNDERLINE", raw: part, start: startIndex, end: endIndex };
        return { type: "TEXT", raw: part, start: startIndex, end: endIndex, activeStyles: [] };
    }).filter(token => token.raw !== "");
}

function parseActiveStyles(tokens) {
    const tagStack = [];

    for (const token of tokens) {
        if (token.type !== "TEXT") {
            if (token.type === "OPEN") {
                tagStack.push(token.style);
            } else {
                tagStack.pop();
            }
        } else {
            token.activeStyles = [...tagStack];
        }
    }

    return tokens;
}

function stripMarkerTokens(originalTokens) {
    const tokens = [...originalTokens];
    return tokens.filter(token => token.type === "TEXT");
}

function applyStyleToSelection(tokens, selectionStart, selectionEnd, action) {
    const [style, enableStr] = action.split(":");
    const enable = enableStr === "true";

    const newTokens = [];

    for (const token of tokens) {
        const { start, end } = token;

        // 1. NO OVERLAP → copy as-is
        if (end <= selectionStart || start >= selectionEnd) {
            newTokens.push({ ...token });
            continue;
        }

        // 2. FULL COVERAGE → modify whole token
        if (start >= selectionStart && end <= selectionEnd) {
            const t = { ...token, activeStyles: [...token.activeStyles] };

            if (enable) {
                if (!t.activeStyles.includes(style)) {
                    t.activeStyles.push(style);
                }
            } else {
                t.activeStyles = t.activeStyles.filter(s => s !== style);
            }

            newTokens.push(t);
            continue;
        }

        // 3. PARTIAL OVERLAP → SPLIT

        // left part (if needed)
        if (start < selectionStart) {
            newTokens.push({
                ...token,
                end: selectionStart,
                raw: token.raw.slice(0, selectionStart - start),
                activeStyles: [...token.activeStyles]
            });
        }

        // middle part (selected range)
        const midStart = Math.max(start, selectionStart);
        const midEnd = Math.min(end, selectionEnd);

        const middle = {
            ...token,
            start: midStart,
            end: midEnd,
            raw: token.raw.slice(midStart - start, midEnd - start),
            activeStyles: [...token.activeStyles]
        };

        if (enable) {
            if (!middle.activeStyles.includes(style)) {
                middle.activeStyles.push(style);
            }
        } else {
            middle.activeStyles = middle.activeStyles.filter(s => s !== style);
        }

        newTokens.push(middle);

        // right part (if needed)
        if (end > selectionEnd) {
            newTokens.push({
                ...token,
                start: selectionEnd,
                raw: token.raw.slice(selectionEnd - start),
                activeStyles: [...token.activeStyles]
            });
        }
    }

    return newTokens;
}

function insertMarkerTokens(originalTokens) {
    const openStack = [];
    const newTokens = [];

    for (const token of originalTokens) {
        if (token.type !== "TEXT") continue;

        const desired = token.activeStyles || [];

        const max = Math.max(openStack.length, desired.length);

        let mismatchIndex = -1;
        for (let i = 0; i < max; i++) {
            if (openStack[i] !== desired[i]) {
                mismatchIndex = i;
                break;
            }
        }

        if (mismatchIndex === -1) {
            mismatchIndex = max;
        }

        for (let i = openStack.length - 1; i >= mismatchIndex; i--) {
            const style = openStack[i];

            newTokens.push({
                type: "CLOSE",
                style,
                raw: tagMap[`${style}_CLOSE`]
            });
        }

        openStack.length = mismatchIndex;

        for (let i = mismatchIndex; i < desired.length; i++) {
            const style = desired[i];

            newTokens.push({
                type: "OPEN",
                style,
                raw: tagMap[`${style}_OPEN`]
            });

            openStack.push(style);
        }

        newTokens.push(token);
    }

    for (let i = openStack.length - 1; i >= 0; i--) {
        const style = openStack[i];

        newTokens.push({
            type: "CLOSE",
            style,
            raw: tagMap[`${style}_CLOSE`]
        });
    }

    return newTokens;
}

function convertTokensToString(tokens) {
    let string = "";

    for (const token of tokens) {
        string += token.raw;
    }

    return string;
}
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

// TODO: Note to trigger UI Update run content[targetIndex].version += 1
export function wrapSelection(content, action) {
    const { itemId, startOffset, endOffset } = editorSelectionStore;
    if (!itemId) return;

    const targetIndex = content.findIndex(item => item.id === itemId);
    if (targetIndex === -1) return;

    if (content[targetIndex].type === "image") return;

    console.log("////============////");

    const originalText = content[targetIndex].data;

    const tokens = parseActiveStyles(tokenize(originalText));
    const affectedTokens = getAffectedTokens(tokens, startOffset, endOffset);
    const updatedTokens = splitTokens(affectedTokens, tokens, startOffset, endOffset, action);
    const finalTokens = insertMarkerTokens(updatedTokens);

    console.log("finalTokens: ", finalTokens);

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

function getAffectedTokens(tokens, startOffset, endOffset) {
    let affectedTokens = [];

    // Look for startOffset token
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type !== "TEXT") continue;

        if (startOffset >= tokens[i].start && startOffset <= tokens[i].end) {
            affectedTokens.push(i);
            break;
        }
    }

    // Find endOffset token
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].type !== "TEXT") continue;
        if (affectedTokens.includes(i)) continue;

        if (endOffset >= tokens[i].start && endOffset <= tokens[i].end) {
            if (!affectedTokens.includes(i)) affectedTokens.push(i);
            break;
        }
    }

    return affectedTokens;
}

// TODO: Refactor; split up to reduce "cognitive load"
function splitTokens(tokenIndices, originalTokens, selectionStart, selectionEnd, action) {
    const tokens = [...originalTokens];

    const startTokenIndex = tokenIndices[0];
    let endTokenIndex = tokenIndices.length === 1 ? tokenIndices[0] : tokenIndices[1];

    const [style, enableStr] = action.split(":");
    const isEnable = enableStr === "true";

    if (tokenIndices.length === 1 && selectionStart === tokens[tokenIndices[0]].start && selectionEnd - 1 === tokens[tokenIndices[0]].end) {
        // Handle single affected tokens first
        if (isEnable) {
            if (!tokens[startTokenIndex].activeStyles.includes(style)) tokens[startTokenIndex].activeStyles.push(style);
        } else {
            tokens[startTokenIndex].activeStyles = tokens[startTokenIndex].activeStyles.filter(s => s !== style);
        }
    } else if (startTokenIndex === endTokenIndex) {
        console.log("here2");
        const token = tokens[startTokenIndex];
        const text = token.raw;

        if (selectionStart === token.start) {
            const localEnd = selectionEnd === 0 ? token.end - selectionEnd : token.end - (token.end - selectionEnd);

            const beforeText = text.substring(0, localEnd);
            const afterText = text.substring(localEnd);

            const beforeToken = {
                type: "TEXT",
                raw: beforeText,
                start: token.start,
                end: localEnd,
                activeStyles: [...token.activeStyles]
            };

            const afterToken = {
                type: "TEXT",
                raw: afterText,
                start: localEnd,
                end: token.end,
                activeStyles: [...token.activeStyles]
            };

            if (isEnable) {
                if (!beforeToken.activeStyles.includes(style)) beforeToken.activeStyles.push(style);
            } else {
                beforeToken.activeStyles = beforeToken.activeStyles.filter(s => s !== style);
            }

            tokens.splice(startTokenIndex, 1, beforeToken, afterToken);
        } else if (selectionEnd === token.end) {
            const localStart = token.end - (token.end - selectionStart);

            const beforeText = text.substring(0, localStart);
            const afterText = text.substring(localStart);

            const beforeToken = {
                type: "TEXT",
                raw: beforeText,
                start: token.start,
                end: localStart,
                activeStyles: [...token.activeStyles]
            };

            const afterToken = {
                type: "TEXT",
                raw: afterText,
                start: localStart,
                end: token.end,
                activeStyles: [...token.activeStyles]
            };

            if (isEnable) {
                if (!afterToken.activeStyles.includes(style)) afterToken.activeStyles.push(style);
            } else {
                afterToken.activeStyles = afterToken.activeStyles.filter(s => s !== style);
            }

            tokens.splice(startTokenIndex, 1, beforeToken, afterToken);
        } else {
            const localStart = token.end - (token.end - selectionStart);
            const localEnd = token.end - (token.end - selectionEnd);

            const textPart1 = text.substring(0, localStart);
            const textPart2 = text.substring(localStart, localEnd);
            const textPart3 = text.substring(localEnd);

            const token1 = {
                type: "TEXT",
                raw: textPart1,
                start: token.start,
                end: localStart,
                activeStyles: [...token.activeStyles]
            };

            const token2 = {
                type: "TEXT",
                raw: textPart2,
                start: localStart,
                end: localEnd,
                activeStyles: [...token.activeStyles]
            };

            const token3 = {
                type: "TEXT",
                raw: textPart3,
                start: localEnd,
                end: token.end,
                activeStyles: [...token.activeStyles]
            };

            if (isEnable) {
                if (!token2.activeStyles.includes(style)) token2.activeStyles.push(style);
            } else {
                token2.activeStyles = token2.activeStyles.filter(s => s !== style);
            }

            tokens.splice(startTokenIndex, 1, token1, token2, token3);
        }
    } else if (tokenIndices.length > 1) {
        // Multitoken selection
        const affectedTokens = [];
        for (let i = startTokenIndex; i <= endTokenIndex; i++) {
            if (tokens[i].type !== "TEXT") continue;
            affectedTokens.push([tokens[i], i]);
        }

        // Split last token if needed
        const lastToken = affectedTokens[affectedTokens.length - 1];
        if (lastToken[0].end !== selectionEnd) {
            const localEnd = selectionEnd - lastToken[0].start;
            const tokenText = lastToken[0].raw;

            const beforeText = tokenText.substring(0, localEnd);
            const afterText = tokenText.substring(localEnd);

            const beforeToken = {
                ...lastToken[0],
                activeStyles: [...lastToken[0].activeStyles],
                raw: beforeText,
                end: localEnd
            };
            const afterToken = {
                ...lastToken[0],
                activeStyles: [...lastToken[0].activeStyles],
                raw: afterText,
                start: localEnd
            };

            if (isEnable) {
                if (!beforeToken.activeStyles.includes(style)) beforeToken.activeStyles.push(style);
            } else {
                beforeToken.activeStyles = beforeToken.activeStyles.filter(s => s !== style);
            }

            tokens.splice(lastToken[1], 1, beforeToken, afterToken);
        }

        // If there are more tokens, update their activeStyles
        if (affectedTokens.length > 2) {
            for (let i = 1; i < affectedTokens.length - 1; i++) {
                const token = affectedTokens[i][0];
                if (isEnable) {
                    if (!token.activeStyles.includes(style)) token.activeStyles.push(style);
                } else {
                    token.activeStyles = token.activeStyles.filter(s => s !== style);
                }
            }
        }

        // Split first token if needed
        const firstToken = affectedTokens[0];
        if (firstToken[0].start !== selectionStart) {
            const localStart = firstToken[0].end - (firstToken[0].end - selectionStart);
            const tokenText = firstToken[0].raw;

            const beforeText = tokenText.substring(0, localStart);
            const afterText = tokenText.substring(localStart);

            const beforeToken = {
                ...firstToken[0],
                activeStyles: [...firstToken[0].activeStyles],
                raw: beforeText,
                end: localStart
            };

            const afterToken = {
                ...firstToken[0],
                activeStyles: [...firstToken[0].activeStyles],
                raw: afterText,
                start: localStart
            };

            if (isEnable) {
                if (!afterToken.activeStyles.includes(style)) afterToken.activeStyles.push(style);
            } else {
                afterToken.activeStyles = afterToken.activeStyles.filter(s => s !== style);
            }

            tokens.splice(firstToken[1], 1, beforeToken, afterToken);
        }
    }

    return tokens;
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
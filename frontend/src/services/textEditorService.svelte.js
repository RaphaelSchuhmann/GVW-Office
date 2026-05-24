import { editorSelectionStore } from "../stores/textEditorSelection.svelte.js";

const tags = new Set(["**>", "<**", "//>", "<//", "__>", "<__"]);
// const pairMap = new Map([["**>", "<**"], ["//>", "<//"], ["__>", "<__"]]);
const tagToHtmlMap = {
    "**>": "<strong>",
    "<**": "</strong>",
    "//>": "<em>",
    "<//": "</em>",
    "__>": "<u>",
    "<__": "</u>"
};

export const actionMap = {
    bold: ["**>", "<**"],
    italic: ["//>", "<//"],
    underline: ["__>", "<__"]
};

export function renderToHTML(text) {
    const tagRegex = /(\*\*&gt;|&lt;\*\*|\/\/&gt;|&lt;\/\/|__&gt;|&lt;__)/g;
    const literalTagRegex = /(\*\*>|<\*\*|\/\/>|<\/\/|__>|<__)/g;

    let parts = text.split(literalTagRegex);
    parts = parts.filter(part => part !== "");

    for (let i = 0; i < parts.length; i++) {
        if (tags.has(parts[i])) {
            parts[i] = tagToHtmlMap[parts[i]];
        }
    }

    text = parts.join("");

    return text;
}

export function wrapSelection(content, action) {
    const { itemId, startOffset, endOffset } = editorSelectionStore;
    if (!itemId) return;

    const targetIndex = content.findIndex(item => item.id === itemId);
    if (targetIndex === -1) return;

    if (content[targetIndex].type === "image") return;

    const originalText = content[targetIndex].data;

    const tokens = parseActiveStyles(tokenize(originalText));
    const affectedTokens = getAffectedTokens(tokens, startOffset, endOffset);

    console.log(affectedTokens);
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
        if (part === "//>;") return { type: "OPEN", style: "ITALIC", raw: part, start: startIndex, end: endIndex };
        if (part === "<\/\/") return { type: "CLOSE", style: "ITALIC", raw: part, start: startIndex, end: endIndex };
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
    let affected = [];
    let startOffsetConsumed = false;

    console.log(startOffset);
    console.log(endOffset);

    for (const token of tokens) {
        if (token.type !== "TEXT") continue;

        if (!startOffsetConsumed) {
            if (startOffset >= token.start && startOffset <= token.end && !affected.includes(token)) affected.push(token);
        } else {
            if (endOffset >= token.start && endOffset <= token.end && !affected.includes(token)) affected.push(token);
        }
    }

    return affected;
}
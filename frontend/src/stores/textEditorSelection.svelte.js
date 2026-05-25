export const editorSelectionStore = $state({
    domNode: null,
    selection: {
        startOffset: 0,
        endOffset: 0,
        itemId: null,
        isMultitoken: false,
        isBold: false,
        isItalic: false,
        isUnderline: false,
    }
});
export const blockTypes = new Set(["text", "image", "file", "blockquote", "headingT1", "headingT2", "headingT3"]);

export function addBlock(items, insertAfterIndex, content, type) {
    if (insertAfterIndex < 0 && items.length > 0 || insertAfterIndex === -1) return;

    if (!blockTypes.has(type)) return;

    const id = crypto.randomUUID();

    const block = {
        id: id,
        type: type,
        data: content,
    };

    if (items.length === 0) {
        items.push(block);
        return;
    }

    items.splice(insertAfterIndex + 1, 0, block);

    return id;
}

export function updateStylesInDOM(content, action) {

}
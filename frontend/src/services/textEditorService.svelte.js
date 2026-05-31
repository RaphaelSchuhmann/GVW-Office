export const blockTypes = new Set(["text", "image", "file", "blockquote", "h1", "h2", "h3", "h4"]);

// TODO: Implement adding and removal of images (if possible also via just drag and drop and copy paste)
// TODO: Implement metadata view + editing of metadata
// TODO: Implement file attachments in metadata

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

export function updateStylesInDOM(content, action) {

}
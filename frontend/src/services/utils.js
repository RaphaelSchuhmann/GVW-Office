export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// export function capitalizeWords(str) {
//     return str
//         .toLowerCase()
//         .split(" ")
//         .map(word =>
//             word.charAt(0).toUpperCase() + word.slice(1)
//         )
//         .join(" ");
// }

export function capitalizeWords(str) {
    return str
        .toLowerCase()
        .replace(/(^|[\s-_])\w/g, match => match.toUpperCase());
}

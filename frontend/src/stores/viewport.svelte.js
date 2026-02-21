// We use a private $state variable for the raw width
let _width = $state(window.innerWidth);

// Create a manual listener that updates our state
// This bypasses the Svelte binding logic and talks to the browser directly
window.addEventListener('resize', () => {
    _width = window.innerWidth;
});

export const viewport = {
    // We provide a getter so components can "read" the width
    get width() {
        return _width;
    },
    // The derived logic stays the same
    get isMobile() {
        return _width < 768;
    }
};
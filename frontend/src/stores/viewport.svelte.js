let width = $state(0);

if (typeof window !== "undefined") {
    width = window.innerWidth;

    const onResize = () => (width = window.innerWidth);
    window.addEventListener('resize', onResize);
}

const isMobile = $derived(width < 768);
const isTablet = $derived(width >= 768 && width < 1024);
const isDesktop = $derived(width >= 1024);

export function useViewport() {
    return {
        width,
        isMobile,
        isTablet,
        isDesktop,
    };
}
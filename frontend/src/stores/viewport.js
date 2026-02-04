import { writable, derived } from "svelte/store";

export const viewportWidth = writable(0);
export const isMobile = derived(viewportWidth, $width => $width < 768);
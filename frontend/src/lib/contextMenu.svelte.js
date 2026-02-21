export function createContextMenu() {
    let state = $state({
        open: false,
        x: 0,
        y: 0,
        activeId: null
    });

    function openFromEvent(event, id, width = 200, height = 150) {
        event.preventDefault();
        event.stopPropagation();
        state.activeId = id;

        requestAnimationFrame(() => {
            state.x = Math.min(event.clientX, window.innerWidth - width);
            state.y = Math.min(event.clientY, window.innerHeight - height);
            state.open = true;
        });
    }

    function openFromButton(event, id, width = 170, height = 150) {
        event.preventDefault();
        event.stopPropagation();
        state.activeId = id;

        const rect = event.currentTarget.getBoundingClientRect();
        state.open = true;

        requestAnimationFrame(() => {
            state.x = rect.left - width;
            state.y = Math.min(rect.bottom, window.innerHeight - height);
        });
    }

    return {
        get data() { return state; },
        openFromEvent,
        openFromButton
    };
}
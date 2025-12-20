<script>
    import Toast from "./Toast.svelte";

    let toasts = [];

    export function addToast(type = "info", title = "Title", subTitle = "Sub Title") {
        let validTypes = ["info", "error", "warning", "success"];
        if (!validTypes.includes(type)) {
            console.warn(`Type ${type} is not a valid type`);
            return;
        }

        let maxId = toasts.length > 0 ? Math.max(...toasts.map(t => t.id)) : 0;
        toasts = [...toasts, { id: maxId + 1, type: type, title: title, subTitle: subTitle }];
    }

    function removeToast(id) {
        toasts = toasts.filter(t => t.id !== id);
    }
</script>

<div class="absolute top-5 right-5 flex flex-col items-center w-1/4 h-auto max-h-3/4">
    {#each toasts as toast (toast.id)}
        <Toast type={toast.type} title={toast.title} subTitle={toast.subTitle} onClose={() => removeToast(toast.id)}
               marginTop="5" />
    {/each}
</div>
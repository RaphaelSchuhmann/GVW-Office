<script>
    import Toast from "./Toast.svelte";

    let toasts = [
        { id: 1, type: "info", title: "Info Toast", subTitle: "Subtitle and associated information containing to the event. Information to not exceed [x] characters" },
        { id: 2, type: "error", title: "Error Toast", subTitle: "Dies ist eine error/test Benachrichtigung" }
    ];

    function removeToast(id) {
        toasts = toasts.filter(t => t.id !== id);
    }
</script>

<div class="absolute top-5 right-5 flex flex-col items-center w-1/4 h-auto max-h-3/4">
    {#each toasts as toast (toast.id)}
        <Toast type={toast.type} title={toast.title} subTitle={toast.subTitle} onClose={() => removeToast(toast.id)} marginTop="5"/>
    {/each}
</div>
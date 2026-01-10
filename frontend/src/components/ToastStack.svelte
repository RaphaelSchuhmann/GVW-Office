<script>
    import Toast from "./Toast.svelte";
    import { toasts, removeToast } from "../stores/toasts";
</script>

<div class="absolute z-9999 top-5 right-5 flex flex-col items-center w-1/4 h-auto max-h-3/4">
    {#each $toasts as toast (toast.id)}
        <Toast type={toast.type} title={toast.title} subTitle={toast.subTitle} onClose={() => removeToast(toast.id)}
               marginTop="5" />
    {/each}
</div>
<script>
    import { getReportImage } from "../../services/reportService.svelte.js";
    import Spinner from "../Spinner.svelte";

    let {
        imageId,
        reportId,
        alt = "Bericht bild",
        ...restProps
    } = $props();

    let srcUrl = $state(null);
    let isLoading = $state(true);

    $effect(() => {
       let active = true;
       isLoading = true;

       async function loadImage() {
           const url = await getReportImage(reportId, imageId);
           if (active) {
               srcUrl = url;
               isLoading = false;
           }
       }

       loadImage();

       return () => {
           active = false;
           if (srcUrl) URL.revokeObjectURL(srcUrl);
       };
    });
</script>

{#if isLoading}
    <div class="flex items-center justify-center rounded-2 w-full border-2 border-gv-border p-10">
        <Spinner />
    </div>
{:else}
    <img src={srcUrl} alt={alt} class="rounded-2 border-2 border-gv-border"/>
{/if}
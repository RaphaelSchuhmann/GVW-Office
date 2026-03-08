<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { addToast } from "../stores/toasts.svelte";
    import { viewport } from "../stores/viewport.svelte";

    let {
        title = "",
        marginTop = "",
        page = "library",
        validTypes = [],
        files = $bindable([]),
        ...restProps
    } = $props();

    const activePage = $derived(["library"].includes(page) ? page : "library");
    const icon = $derived(activePage === "library" ? "audio_file" : "draft");
    const acceptString = $derived(validTypes.map(t => `.${t}`).join(","));

    /**
     * Handles file selection via a dynamic input element
     */
    async function addFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = acceptString;
        input.multiple = false;

        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            if (!files.some(p => p.name === file.name)) {
                files = [...files, file];
            } else {
                addToast({
                    title: "Datei wird schon verwendet",
                    subTitle: !viewport.isMobile ? "Die von ihnen ausgewählte Datei ist bereits im Anhang." : "",
                    type: "warning"
                });
            }
        };

        input.click();
    }

    /**
     * Removes a file from the list
     */
    function removeFile(file) {
        files = files.filter(f => f !== file);
    }
</script>

<div class={`flex flex-col items-start justify-start gap-1 w-full ${marginMap[marginTop]}`} {...restProps}>
    <p class="text-dt-6 font-medium">{title}</p>
    <div class="flex-1 min-w-0 overflow-x-auto w-full">
        <div class="flex items-center justify-start gap-2 flex-nowrap">
            <button
                type="button"
                class="shrink-0 flex items-center justify-center rounded-2 border-2 border-gv-border p-2 cursor-pointer hover:bg-gv-input-bg duration-200"
                onclick={addFile}
                aria-label="Datei hinzufügen"
            >
                <span class="material-symbols-rounded text-dt-6">attach_file_add</span>
            </button>

            {#each files as file}
                <button
                    type="button"
                    class="group shrink-0 relative flex items-center justify-center rounded-2 border-2 border-gv-border p-2 cursor-pointer hover:bg-gv-input-bg duration-200"
                    onclick={() => removeFile(file)}
                >
                    <div
                        class="flex items-center gap-2 whitespace-nowrap transition-opacity duration-200 group-hover:opacity-0">
                        <span class="material-symbols-rounded text-icon-dt-6">
                          {icon}
                        </span>
                        <p class="text-gv-dark-text text-dt-7">
                            {file.name ? file.name : file}
                        </p>
                    </div>

                    <div
                        class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span class="material-symbols-rounded text-red-600 text-icon-dt-6">
                          attach_file_off
                        </span>
                    </div>
                </button>
            {/each}
        </div>
    </div>
</div>
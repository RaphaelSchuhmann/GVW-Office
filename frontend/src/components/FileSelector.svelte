<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { addToast } from "../stores/toasts";

    export let title = "";
    export let marginTop = "";
    export let page = "";
    export let validTypes = [];
    export let files = [];

    const validPages = ["library"];
    if (!validPages.includes(page)) {
        console.error(`Page ${page} is not a valid page`);
        page = "library";
    }

    let icon = page === "library" ? "audio_file" : "draft";

    async function addFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = validTypes.map(t => `.${t}`).join(",");
        input.multiple = false;

        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            // Prevent duplicates
            if (!files.some(p => p.name === file.name)) {
                files = [...files, file];
            } else {
                addToast({
                    title: "Datei wird schon verwendet",
                    subTitle: "Die von ihnen ausgewählte Datei ist bereits im Anhang und wird schon verwendet.",
                    type: "warning"
                });
            }
        }

        input.click();
    }

    function removeFile(file) {
        files = files.filter(f => f !== file);
    }
</script>

<div class={`flex flex-col items-start justify-start gap-1 w-full ${marginMap[marginTop]}`}>
    <p class="text-dt-6 font-medium">{title}</p>
    <div class="flex-1 min-w-0 overflow-x-auto w-full">
        <div class="flex items-center justify-start gap-2 flex-nowrap">
            <button class="shrink-0 flex items-center justify-center rounded-2 border-2 border-gv-border p-2 cursor-pointer hover:bg-gv-input-bg duration-200"
                on:click={addFile} aria-label="Datei hinzufügen">
                <span class="material-symbols-rounded text-dt-6">attach_file_add</span>
            </button>
            {#each files as file}
                <button
                        class="group shrink-0 relative flex items-center justify-center rounded-2 border-2 border-gv-border p-2 cursor-pointer hover:bg-gv-input-bg duration-200"
                        on:click={() => removeFile(file)}>
                    <!-- Normal content (defines size) -->
                    <div class="flex items-center gap-2 whitespace-nowrap transition-opacity duration-200 group-hover:opacity-0">
                        <span class="material-symbols-rounded text-icon-dt-6">
                          {icon}
                        </span>
                        <p class="text-gv-dark-text text-dt-7">
                            {file.name ? file.name : file}
                        </p>
                    </div>

                    <!-- Hover overlay -->
                    <div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span class="material-symbols-rounded text-red-600 text-icon-dt-6">
                          attach_file_off
                        </span>
                    </div>
                </button>
            {/each}
        </div>
    </div>
</div>
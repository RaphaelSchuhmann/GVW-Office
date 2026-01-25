<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { getFileNameFromPath } from "../services/utils";

    export let title = "";
    export let marginTop = "";
    export let page = "";
    export let validTypes = [];
    export let paths = [];

    const validPages = ["library"];
    if (!validPages.includes(page)) {
        console.error(`Page ${page} is not a valid page`);
        page = "library";
    }

    let icon = page === "library" ? "audio_file" : "draft";

    async function addFile() {
        const file = await window.api.openFileDialog({
            title: "Notendatei auswählen",
            filters: [
                { name: "Noten", extensions: validTypes }
            ]
        });

        // Only add file when it exists and isn't already in the paths array
        if (file[0] && !paths.includes(file[0])) {
            paths = [...paths, file[0]];
        }
    }

    function removeFile(filePath) {
        paths = paths.filter(path => path !== filePath);
    }
</script>

<div class={`flex flex-col items-start justify-start gap-1 w-full ${marginMap[marginTop]}`}>
    <p class="text-dt-6 font-medium">{title}</p>
    <div class="flex-1 min-w-0 overflow-x-auto w-full">
        <div class="flex items-center justify-start gap-2 flex-nowrap">
            <button class="shrink-0 flex items-center justify-center rounded-2 border-2 border-gv-border p-2 cursor-pointer hover:bg-gv-input-bg duration-200"
                on:click={addFile}>
                <span class="material-symbols-rounded text-dt-6">attach_file_add</span>
            </button>
            {#each paths as path}
                <button
                        class="group shrink-0 relative flex items-center justify-center rounded-2 border-2 border-gv-border p-2 cursor-pointer hover:bg-gv-input-bg duration-200"
                        on:click={() => removeFile(path)}>
                    <!-- Normal content (defines size) -->
                    <div class="flex items-center gap-2 whitespace-nowrap transition-opacity duration-200 group-hover:opacity-0">
                        <span class="material-symbols-rounded text-icon-dt-6">
                          {icon}
                        </span>
                        <p class="text-gv-dark-text text-dt-7">
                            {getFileNameFromPath(path)}
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
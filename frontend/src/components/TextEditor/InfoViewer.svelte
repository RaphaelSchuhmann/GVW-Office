<script>
    import Chip from "../Chip.svelte";
    import { formatISODateString } from "../../services/dateTimeUtils.js";
    import { tick } from "svelte";

    let {
        data = $bindable({}),
        categoryMap,
        updateDescription,
        ...restProps
    } = $props();

    let _isOpen = $state(false);
    let isEditingDescription = $state(false);
    let descriptionDraft = $state("");
    let descriptionTextAreaRef = $state(null);

    // TODO: Note, if a file is selected in the attachments it should be instantly uploaded

    export const isOpen = {
        get value() {
            return _isOpen;
        }
    };

    export function openViewer() {
        _isOpen = true;
    }

    export function closeViewer() {
        _isOpen = false;
    }

    function toggleEditDescription() {
        if (isEditingDescription) {
            saveDescription();
            isEditingDescription = false;
            descriptionDraft = "";
        } else {
            descriptionDraft = data.description;
            isEditingDescription = true;

            tick().then(() => {
                descriptionTextAreaRef?.focus();
            });
        }
    }

    async function saveDescription() {
        let description = descriptionDraft;
        if (descriptionDraft.trim().length === 0) description = "Keine Beschreibung";

        // Note: Parameters pattern always: documentId, documentRev, description
        //       It should also always return if it was successful as well as
        //       the new rev so the data can be updated
        const resp = await updateDescription(data.id, data.rev, description);

        if (resp.success) {
            data.rev = resp.rev;
            data.description = description;
        }
    }
</script>

{#if _isOpen}
    <div
        class="max-w-1/3 h-full flex-1 flex flex-col items-start justify-start rounded-1 bg-white drop-shadow-md min-h-0 gap-4">
        <div class="flex items-center w-full p-2 pl-4">
            <div class="flex items-center justify-start gap-4">
                <span class="material-symbols-rounded text-icon-dt-3 text-gv-dark-text">info</span>
                <p class="text-gv-dark-text text-dt-3">Details</p>
            </div>
            <button
                type="button"
                class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2"
                onclick={closeViewer}
            >
                <span class="material-symbols-rounded text-icon-dt-3">close</span>
            </button>
        </div>
        <div class="flex items-center justify-start w-full pl-4">
            <Chip text={categoryMap[data.type] || "Unbekannt"} fontSize="6" />
        </div>
        <div class="flex flex-col items-start justify-start w-full pl-4 pr-4 p-2 gap-4">
            <div class="flex items-center justify-start w-full">
                <div class="flex items-center justify-start gap-2">
                    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-5">person</span>
                    <p class="text-gv-dark-text text-dt-5">Author</p>
                </div>
                <p class="text-gv-dark-text text-dt-5 text-nowrap truncate ml-auto">{data.author}</p>
            </div>
            <div class="flex items-center justify-start w-full">
                <div class="flex items-center justify-start gap-2">
                    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-5">edit_square</span>
                    <p class="text-gv-dark-text text-dt-5">Zuletzt bearbeitet von</p>
                </div>
                <p class="text-gv-dark-text text-dt-5 text-nowrap truncate ml-auto">{data.lastEditedBy}</p>
            </div>
        </div>
        <div class="flex flex-col items-start justify-start w-full pl-4 pr-4 p-2 gap-4">
            <p class="text-gv-dark-text text-dt-4 font-bold">Info</p>
            <div class="flex items-center justify-start w-full">
                <div class="flex items-center justify-start gap-2">
                    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-5">list</span>
                    <p class="text-gv-dark-text text-dt-5">Länge</p>
                </div>
                <p class="text-gv-dark-text text-dt-5 text-nowrap truncate ml-auto">
                    {`${data.wordCount} ${data.wordCount > 1 ? "Wörter" : "Wort"} - ${data.readingTimeInMinutes} ${data.readingTimeInMinutes === 1 ? "Minute" : "Minuten"} lesen`}
                </p>
            </div>
            <div class="flex items-center justify-start w-full">
                <div class="flex items-center justify-start gap-2">
                    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-5">schedule</span>
                    <p class="text-gv-dark-text text-dt-5">Erstellt</p>
                </div>
                <p class="text-gv-dark-text text-dt-5 text-nowrap truncate ml-auto">{formatISODateString(data.createdAt)}</p>
            </div>
        </div>
        <div class="flex flex-col items-start justify-start w-full pl-4 pr-4 p-2 gap-4">
            <p class="text-gv-dark-text text-dt-4 font-bold">Beschreibung</p>
            <div class="flex items-start justify-start w-full">
                {#if isEditingDescription}
                    <textarea bind:this={descriptionTextAreaRef} bind:value={descriptionDraft} class="resize-y bg-transparent border-none w-full text-gv-dark-text text-dt-5"></textarea>
                {:else}
                    <p class="text-gv-dark-text text-dt-5">{data.description}</p>
                {/if}
                <button
                    class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-1 rounded-2"
                    onclick={toggleEditDescription}>
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">{isEditingDescription ? "check" : "edit"}</span>
                </button>
            </div>
        </div>
    </div>
{/if}
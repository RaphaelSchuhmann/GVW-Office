<script>
    import { viewport } from "../../stores/viewport.svelte";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import Button from "../../components/Button.svelte";
    import { push } from "svelte-spa-router";
    import Spinner from "../../components/Spinner.svelte";
    import TextEditor from "../../components/TextEditor.svelte";

    let {
        reportData,
        ...restProps
    } = $props();

    let isEditing = $state(false);
    let isSubmitting = $state(false);
</script>

<ToastStack />

<main class="flex overflow-hidden">
    <DesktopSidebar currentPage="reports" />
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0 gap-7">
        <div class="flex w-full items-center">
            <div class="flex items-center justify-start gap-4 max-w-2/5">
                <p class="text-gv-dark-text text-dt-3 text-nowrap truncate">{reportData?.title}</p>
                <button
                    class="flex items-center gap-2 p-1.5 pl-3 pr-3 border-2 border-gv-border rounded-2 cursor-pointer hover:bg-gv-input-bg">
                    <span class="material-symbols-rounded text-gv-dark-text text-icon-dt-6">download</span>
                    <span class="text-gv-dark-text text-dt-7 font-semibold">PDF</span>
                </button>
            </div>
            <div class="flex items-center justify-start gap-2 ml-auto">
                {#if !isEditing}
                    <Button type="secondary" padding="3" onclick={async () => await push("/reports")}>
                        <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_back</span>
                        <p class="text-dt-6 text-gv-dark-text ml-2">Zurück</p>
                    </Button>
                    <button class="bg-gv-primary p-2 pl-4 pr-4 text-white cursor-pointer hover:bg-gv-primary-hover rounded-1 flex items-center justify-center aspect-square">
                        <span class="material-symbols-rounded text-icon-dt-6">info</span>
                    </button>
                {:else}
                    <Button type="primary">
                        {#if isSubmitting}
                            <Spinner light={true} />
                            <p>Speichern...</p>
                        {:else}
                            Speichern
                        {/if}
                    </Button>
                    <Button type="secondary">
                        Abbrechen
                    </Button>
                {/if}
            </div>
        </div>
        <div class="flex h-full w-full items-start gap-4">
            <TextEditor isEditing={isEditing} title={reportData?.title} author={reportData?.author} readingTime={reportData?.readingTimeInMinutes} />
        </div>
    </div>
</main>
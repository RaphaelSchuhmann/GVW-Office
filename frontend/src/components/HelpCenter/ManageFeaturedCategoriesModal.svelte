<script>
    import Modal from "../Modal.svelte";
    import Button from "../Button.svelte";
    import Spinner from "../Spinner.svelte";
    import Card from "../Card.svelte";
    import Checkbox from "../Checkbox.svelte";
    import { appSettings } from "../../stores/appSettings.svelte.js";
    import { updateHelpCenterCategoryFeaturedList } from "../../services/helpCenterService.svelte.js";

    let { isMobile = false, ...restProps } = $props();

    let modalRef = $state(null);
    let isSubmitting = $state(false);

    let inputs = $state(new Map());

    $effect(() => {
        if (appSettings.helpCenterCategories) {
            inputs = new Map(appSettings.helpCenterCategories.map(obj => [obj.id, !!obj.isFeatured]));
        }
    });

    let getEnabledCount = $derived(Array.from(inputs.values()).filter(val => val).length);
    let addDisabled = $derived(getEnabledCount < 1 || getEnabledCount > 6);

    function submit() {
        isSubmitting = true;
        try {
            updateHelpCenterCategoryFeaturedList(inputs);
        } finally {
            isSubmitting = false;
            hideModal();
        }
    }

    function cleanup() {
        inputs.clear();
    }

    export function showModal() { modalRef?.showModal(); }
    export function hideModal() { modalRef?.hideModal(); }
</script>

<Modal bind:this={modalRef} title="Kategorien auswählen" hideSubTitle={true} isMobile={isMobile} extraFunction={cleanup}>
    <div class="flex flex-col w-full items-center justify-start gap-4">
        <div class="flex flex-col w-full items-center justify-start gap-2">
            {#each appSettings.helpCenterCategories as category}
                <button class="cursor-pointer disabled:cursor-not-allowed opacity-75 w-full"
                        disabled={getEnabledCount >= 6 && !inputs.get(category.id)}
                        onclick={() => {
                            inputs.set(category.id, !inputs.get(category.id));
                            inputs = new Map(inputs);
                        }}>
                    <Card>
                        <div class="flex items-center justify-start gap-2 w-full">
                            <Checkbox isChecked={inputs.get(category.id)} clickable={false} />

                            <div class="flex items-center justify-center p-2 rounded-2 bg-gv-bg-bar">
                                <span class="material-symbols-rounded text-gv-primary text-icon-dt-5">{category.icon}</span>
                            </div>
                            <p class="text-gv-dark-text text-nowrap truncate text-dt-4">{category.title}</p>
                        </div>
                    </Card>
                </button>
            {/each}
        </div>

        <div class="w-full flex items-center justify-end gap-4">
            <Button type="secondary" onclick={() => modalRef.hideModal()}>Abbrechen</Button>
            <Button type="primary" disabled={addDisabled} onclick={submit} isSubmit={true}>
                {#if isSubmitting}
                    <Spinner light={true} />
                    <p>Speichern...</p>
                {:else}
                    Speichern
                {/if}
            </Button>
        </div>
    </div>
</Modal>
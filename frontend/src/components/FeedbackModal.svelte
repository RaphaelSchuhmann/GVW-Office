<script>
    import { getFeedbackCategories } from "../services/reportHubService.svelte";
    import { appSettings } from "../stores/appSettings.svelte";
    import Dropdown from "./Dropdown.svelte";
    import Input from "./Input.svelte";
    import Modal from "./Modal.svelte";
    import TabBar from "./TabBar.svelte";
    import Textarea from "./Textarea.svelte";

    let {
        isMobile = false,
        ...restProps
    } = $props();

    let selectedView = $state("Feedback");

    /** @type {import("../components/Modal.svelte").default} */
    let modal = $state(null);

    let inputs = $state({
        title: "",
        dropdown: "",
        textarea: "",
        sentiment: 0
    });

    export function showModal() {
        modal.showModal();
    }
</script>

<Modal bind:this={modal} title="Feedback" subTitle="Geben Sie hier Feedback zur App oder melden Sie einen Fehler" isMobile={isMobile}>
    <div class="w-full flex flex-col items-start gap-4">
        <TabBar 
            contents={["Feedback", "Fehler melden"]} 
            selected={selectedView} 
            onChange={(val) => selectedView = val}
        />
        {#if selectedView === "Feedback"}
            <div class="flex items-center gap-4 w-full">
                <Input 
                    title="Titel" 
                    placeholder="Feedback Titel" 
                    bind:value={inputs.title}
                />
                <Dropdown 
                    options={getFeedbackCategories()} 
                    title="Kategorie" 
                    onChange={(val) => inputs.dropdown = appSettings.feedbackCategories[val] || appSettings.feedbackCategories["other"]}
                />
            </div>
            <Textarea 
                bind:value={inputs.textarea} 
                title="Nachricht" 
                placeholder="Feedback..." 
                height="h-[20vh]"
            />
        {:else}
        {/if}
    </div>
</Modal>

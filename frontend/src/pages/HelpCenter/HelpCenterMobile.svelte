<script>
    import { user } from "../../stores/user.svelte.js";
    import { appSettings } from "../../stores/appSettings.svelte.js";

    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import Card from "../../components/Card.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Button from "../../components/Button.svelte";
    import Spinner from "../../components/Spinner.svelte";

    let {
        category,
        ...restProps
    } = $props();

    let sidebarOpen = $state(false);
</script>

<ToastStack isMobile={true}/>

<main class="flex overflow-hidden">
    <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="flex flex-col w-full flex-1 overflow-hidden p-7 min-h-0">
            <div class="w-full flex items-center justify-start">
                <button class="flex items-center justify-center" onclick={() => sidebarOpen = true}>
                    <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">menu</span>
                </button>
            </div>
            <div class="flex items-start justify-start gap-2">
                <p class="font-bold text-dt-5 text-gv-primary">HILFE-CENTER</p>
                <PageHeader title="Wie können wir helfen?" hideSubTitle={true} showSlot={false}/>
            </div>
        </div>
    </div>
</main>
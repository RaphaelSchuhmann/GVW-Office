<svelte:options runes={false} />

<script>
    import { onMount } from "svelte";
    import { loadUserData } from "../services/user";
    import { getLibraryCategories, updateScore } from "../services/library";
    import { push } from "svelte-spa-router";
    import { get } from "svelte/store";
    import { libraryStore } from "../stores/library";
    import { appSettings } from "../stores/appSettings";

    import ToastStack from "../components/ToastStack.svelte";
    import Sidebar from "../components/Sidebar.svelte";
    import PageHeader from "../components/PageHeader.svelte";
    import SettingsModal from "../components/SettingsModal.svelte";
    import Button from "../components/Button.svelte";
    import Input from "../components/Input.svelte";
    import Dropdown from "../components/Dropdown.svelte";
    import Checkbox from "../components/Checkbox.svelte";
    import FileSelector from "../components/FileSelector.svelte";

    /** @type {import("../components/SettingsModal.svelte").default} */
    let settingsModal;

    let score = {
        id: "",
        title: "",
        artist: "",
        type: "",
        voices: [],
        voiceCount: 0,
        paths: []
    };

    let edited = false;
    let categories = getLibraryCategories(false);

    let enteredTitle;
    let enteredArtist;
    let enteredType;
    let voiceT1Checked;
    let voiceT2Checked;
    let voiceB1Checked;
    let voiceB2Checked;
    let voiceSoChecked;
    let voiceAlChecked;
    let enteredPaths;
    let originalFiles;

    function onVoicesChange(voices) {
        voiceT1Checked = false;
        voiceT2Checked = false;
        voiceB1Checked = false;
        voiceB2Checked = false;
        voiceSoChecked = false;
        voiceAlChecked = false;

        for (const voice of voices) {
            switch (voice) {
                case "t":
                    voiceT1Checked = true;
                    break;

                case "t1":
                    voiceT1Checked = true;
                    break;
            
                case "t2":
                    voiceT2Checked = true;
                    break;

                case "b":
                    voiceB1Checked = true;
                    break;

                case "b1":
                    voiceB1Checked = true;
                    break;

                case "b2":
                    voiceB2Checked = true;
                    break;

                case "s":
                    voiceSoChecked = true;
                    break;

                case "a":
                    voiceAlChecked = true;
                    break;

                default:
                    break;
            }
        }

        return;
    }

    async function handleUpdateScore() {
        let voices = [];
        if (voiceT1Checked) voices.push("t1");
        if (voiceT2Checked) voices.push("t2");
        if (voiceB1Checked) voices.push("b1");
        if (voiceB2Checked) voices.push("b2");
        if (voiceSoChecked) voices.push("s");
        if (voiceAlChecked) voices.push("a");

        const updatedScore = {
            id: score.id,
            title: enteredTitle,
            artist: enteredArtist,
            type: get(appSettings).scoreCategories[enteredType],
            voices: voices,
            voiceCount: voices.length,
            originalFiles: originalFiles,
            paths: enteredPaths
        };

        await updateScore(updatedScore);
        await push("/library");
    }

    let formReady = false;
    let originalForm = null;

    $: edited = formReady && (
        enteredTitle !== originalForm.title || enteredArtist !== originalForm.artist || enteredType !== originalForm.type ||
        voiceT1Checked !== originalForm.voiceT1Checked || voiceT2Checked !== originalForm.voiceT2Checked || 
        voiceB1Checked !== originalForm.voiceB1Checked || voiceB2Checked !== originalForm.voiceB2Checked ||
        voiceSoChecked !== originalForm.voiceSoChecked || voiceAlChecked !== originalForm.voiceAlChecked || 
        enteredPaths !== originalForm.paths
    ) && (
        enteredTitle && enteredArtist && enteredType && 
        (voiceT1Checked || voiceT2Checked || voiceB1Checked || voiceB2Checked || voiceSoChecked || voiceAlChecked)
    )

    onMount(async () => {
        await loadUserData();

        const hash = window.location.hash;
        const queryString = hash.split("?")[1];
        if (!queryString) return;

        const params = new URLSearchParams(queryString);
        let scoreId = params.get("id");

        if (scoreId) {
            let scores = get(libraryStore);
            score = scores.raw.find(item => item.id === scoreId);
        } else {
            await push("/library");
        }

        enteredTitle = score.title;
        enteredArtist = score.artist;
        enteredType = get(appSettings).scoreCategories[score.type];
        enteredPaths = score.paths;

        onVoicesChange(score.voices);

        originalForm = {
            title: enteredTitle,
            artist: enteredArtist,
            type: enteredType,
            voiceT1Checked: voiceT1Checked,
            voiceT2Checked: voiceT2Checked,
            voiceB1Checked: voiceB1Checked,
            voiceB2Checked: voiceB2Checked,
            voiceSoChecked: voiceSoChecked,
            voiceAlChecked: voiceAlChecked,
            paths: enteredPaths
        };

        originalFiles = score.paths;

        formReady = true;
    });

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>
<main class="flex overflow-hidden">
    <Sidebar onSettingsClick={settingsClick} currentPage="library"></Sidebar>
    <div class="flex flex-col w-full flex-1 overflow-hidden p-10 min-h-0">
        <PageHeader title="Notenmaterial bearbeiten" subTitle={`Bearbeitung des Notenmaterials: "${score.title ?? ""}"`}>
            <Button type="secondary" isCancel={true} on:click={async () => await push("/library")}>
                <p class="text-dt-4 ml-3">Abbrechen</p>
            </Button>
            <Button type="primary" disabled={!edited} on:click={handleUpdateScore} isSubmit={true}>
                <span class="material-symbols-rounded text-icon-dt-5">edit_document</span>
                <p class="text-dt-4 ml-3">Speichern</p>
            </Button>
        </PageHeader>
        <!-- Allows for scrollable content -->
        <div class="flex-1 min-h-0 overflow-y-auto mt-5">
            <div class="flex flex-col w-2/3 gap-5">
                <Input bind:value={enteredTitle} title="Titel" placeholder="The Final Countdown" marginTop="5"/>
                <Input bind:value={enteredArtist} title="Komponist / Band" placeholder="Europe" marginTop="5"/>
                <Dropdown title="Kategorie" options={categories} selected={enteredType} marginTop="5" onChange={(value) => enteredType = value} />
                <p class="text-dt-6 font-medium mt-5">Stimmen</p>
                <div class="w-full flex items-center justify-start gap-4 mt-1 pr-5">
                    <Checkbox textWrap={false} bind:isChecked={voiceT1Checked} title="1. Tenor"/>
                    <Checkbox textWrap={false} bind:isChecked={voiceT2Checked} title="2. Tenor"/>
                    <Checkbox textWrap={false} bind:isChecked={voiceB1Checked} title="1. Bass"/>
                    <Checkbox textWrap={false} bind:isChecked={voiceB2Checked} title="2. Bass"/>
                    <Checkbox textWrap={false} bind:isChecked={voiceSoChecked} title="Sopran"/>
                    <Checkbox textWrap={false} bind:isChecked={voiceAlChecked} title="Alt"/>
                </div>
                <FileSelector title="Noten" page="library" validTypes={["pdf", "gp", "gp5", "gp3", "gp4", "gpx", "cap", "capx"]} bind:paths={enteredPaths} marginTop="5"/>
            </div>
        </div>
    </div>
</main>
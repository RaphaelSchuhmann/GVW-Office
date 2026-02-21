<script>
    import { push } from "svelte-spa-router";
    import { membersStore } from "../../stores/members";
    import { newMember, roleMap, voiceMap, statusMap } from "../../services/membersService";
    import { viewport } from "../../stores/viewport.svelte";
    import { fetchAndSetRaw } from "../../services/filterService";

    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import Card from "../../components/Card.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import Button from "../../components/Button.svelte";
    import SearchBar from "../../components/SearchBar.svelte";
    import Chip from "../../components/Chip.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import DefaultDatepicker from "../../components/DefaultDatepicker.svelte";
    import YearDatepicker from "../../components/YearDatepicker.svelte";
    import MobileSidebar from "../../components/MobileSidebar.svelte";

    // Refs
    /** @type {import("../../components/SettingsModal.svelte").default} */
    let settingsModal = $state();
    /** @type {import("../../components/Modal.svelte").default} */
    let addMemberModal = $state();

    // ----------------
    // ADD MEMBER STATE
    // ----------------
    let memberInput = $state({
        name: "",
        surname: "",
        email: "",
        phone: "",
        address: "",
        voice: null,
        status: null,
        role: null,
        birthdate: "",
        joined: ""
    });

    const addDisabled = $derived.by(() => {
        const hasEmptyFields = [
            memberInput.name, memberInput.surname, memberInput.email,
            memberInput.phone, memberInput.address, memberInput.birthdate, memberInput.joined
        ].some(val => !val || val.trim() === "");

        const hasUnselectedDropdowns = [
            memberInput.voice, memberInput.status, memberInput.role
        ].some(val => !val || val.toLowerCase() === "wählen");

        return hasEmptyFields || hasUnselectedDropdowns;
    });

    function resetAddInputs() {
        memberInput.name = "";
        memberInput.surname = "";
        memberInput.email = "";
        memberInput.phone = "";
        memberInput.address = "";
        memberInput.birthdate = "";
        memberInput.joined = "";
        memberInput.voice = null;
        memberInput.status = null;
        memberInput.role = null;
    }

    async function submitMember() {
        memberInput.voice = voiceMap[memberInput.voice];
        memberInput.status = statusMap[memberInput.status];
        memberInput.role = roleMap[memberInput.role];

        await newMember($state.snapshot(memberInput));

        addMemberModal.hideModal();

        await fetchAndSetRaw();
    }

    let sidebarOpen = $state(false);

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal} />
<ToastStack isMobile={true} />

<Modal bind:this={addMemberModal} extraFunction={resetAddInputs} title="Neues Mitglied hinzufügen"
       subTitle="Erfassen Sie hier die Mitgliedsdaten" width="2/5" isMobile={true}>
    <Input bind:value={memberInput.name} marginTop="5" title="Vorname" placeholder="Max" />

    <Input bind:value={memberInput.surname} marginTop="5" title="Nachname" placeholder="Mustermann" />

    <Input bind:value={memberInput.email} marginTop="5" title="E-Mail" placeholder="max.mustermann@email.com" />

    <Input bind:value={memberInput.phone} marginTop="5" title="Telefon" placeholder="01701234 5678" />

    <Input bind:value={memberInput.address} marginTop="5" title="Adresse" placeholder="Hauptstraße 1..." />

    <Dropdown onChange={(value) => memberInput.voice = value} title="Stimmlage"
              options={["1. Tenor", "2. Tenor", "1. Bass", "2. Bass"]} marginTop="5" />

    <Dropdown onChange={(value) => memberInput.status = value} title="Status" options={["Aktiv", "Passiv"]} marginTop="5" />

    <Dropdown onChange={(value) => memberInput.role = value} title="Rolle"
              options={["Mitglied", "Vorstand", "Schriftführer", "Chorleitung", "Notenwart"]} displayTop={true} marginTop="5" />

    <div class="w-full flex items-center gap-4 mt-5 flex-col">
        <div class="flex flex-col items-start w-full">
            <p class="text-dt-6 font-medium mb-1">Geburtsdatum</p>
            <DefaultDatepicker onChange={(value) => memberInput.birthdate = value} />
        </div>

        <div class="flex flex-col items-start w-full">
            <p class="text-dt-6 font-medium mb-1">Mitglied seit</p>
            <YearDatepicker onChange={(value) => memberInput.joined = value} />
        </div>
    </div>
    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button type="secondary" onclick={() => addMemberModal.hideModal()}>Abbrechen</Button>
        <Button type="primary" disabled={addDisabled} onclick={submitMember} isSubmit={true}>Hinzufügen</Button>
    </div>
</Modal>

<MobileSidebar onSettingsClick={settingsClick} currentPage="members" bind:isOpen={sidebarOpen} />

<main class="flex overflow-hidden">
    <div class="flex flex-col flex-1 min-h-0 w-full p-7 overflow-y-auto overflow-x-hidden">
        <div class="w-full flex items-center justify-start">
            <button class="flex items-center justify-center" onclick={() => sidebarOpen = true}>
                <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">menu</span>
            </button>
        </div>
        <PageHeader title="Mitglieder" subTitle="Verwaltung aller Vereinsmitglieder" showSlot={false} />

        <div class="flex max-[430px]:flex-col w-full items-center justify-start gap-2 mt-4">
            <Button type="primary" onclick={() => addMemberModal.showModal()}>
                <span class="material-symbols-rounded text-icon-dt-5">add</span>
                <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Mitglied hinzufügen</p>
            </Button>
            <Button type="primary" onclick={fetchAndSetRaw}>
                <span class="material-symbols-rounded text-icon-dt-5">refresh</span>
                <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Aktualisieren</p>
            </Button>
        </div>

        <SearchBar placeholder="Mitglieder durchsuchen..." page="members" marginTop="5" />

        <Card padding="0" marginTop="5" borderThickness={viewport.width > 1300 ? "2" : "1"}>
            <div class="flex-1 min-h-0 overflow-y-auto w-full">
                {#if $membersStore.display.length !== 0}
                    {#each $membersStore.display as member}
                        <button
                            class={`flex items-center w-full ${$membersStore.display.indexOf(member) !== $membersStore.display.length - 1 ? "border-b" : "border-none"} border-gv-border p-2`}
                            onclick={async () =>  await push(`/members/view?id=${member.id}`)}>
                            <div class="flex flex-col items-start justify-between mr-auto max-w-3/4">
                                <p class="text-gv-dark-text text-dt-7">{`${member.name} ${member.surname}`}</p>
                                <div class="flex items-center justify-start gap-2">
                                    <span
                                        class="material-symbols-rounded text-icon-dt-7 text-gv-dark-turquoise">mail</span>
                                    <p class="text-dt-8 text-gv-dark-turquoise text-nowrap truncate">{member.email}</p>
                                </div>
                            </div>

                            <Chip text={statusMap[member.status]} fontSize="7" />
                        </button>
                    {/each}
                {:else}
                    <p class="text-dt-3 text-gv-dark-text text-center w-full h-full p-10 font-semibold">Es wurden keine
                        Mitglieder gefunden!</p>
                {/if}
            </div>
        </Card>
    </div>
</main>
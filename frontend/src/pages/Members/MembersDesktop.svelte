<script>
    import { push } from "svelte-spa-router";
    import { get } from "svelte/store";
    import { membersStore } from "../../stores/members";
    import { newMember, roleMap, voiceMap, statusMap, switchMemberStatus } from "../../services/membersService";
    import { addToast } from "../../stores/toasts";
    import { viewport } from "../../stores/viewport.svelte";
    import { fetchAndSetRaw } from "../../services/filterService";
    import { createContextMenu } from "../../lib/contextMenu.svelte.js";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
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
    import ContextMenu from "../../components/ContextMenu.svelte";
    import ConfirmDeleteModal from "../../components/ConfirmDeleteModal.svelte";

    // Refs
    /** @type {import("../../components/SettingsModal.svelte").default} */
    let settingsModal = $state();
    /** @type {import("../../components/Modal.svelte").default} */
    let addMemberModal = $state();
    /** @type {import("../../components/ConfirmDeleteModal.svelte").default} */
    let confirmDeleteMemberModal = $state();

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

    // -------------------
    // DELETE MEMBER STATE
    // -------------------
    let memberName = $state("");

    async function startDeleteMember() {
        menu.data.open = false;
        const membersRaw = get(membersStore).raw;
        const member = membersRaw.find(item => item.id === menu.data.activeId);

        if (!member) {
            addToast({
                title: "Mitglied nicht gefunden",
                subTitle: "Das ausgewählte Mitglied wrude nicht gefunden. Bitte versuchen Sie es erneut.",
                type: "error"
            });
            return;
        }

        memberName = `${member?.name} ${member?.surname}`;

        confirmDeleteMemberModal.startDelete();
    }

    // ------------------
    // CONTEXT MENU STATE
    // ------------------
    let menu = createContextMenu();

    async function handleSwitchStatus() {
        if (!menu.data.activeId) return;

        await switchMemberStatus(menu.data.activeId);

        menu.data.open = false;
        await fetchAndSetRaw();
    }

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<svelte:window oncontextmenu={() => (menu.data.open = false)} />

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack isMobile={false}/>

<Modal bind:this={addMemberModal} extraFunction={resetAddInputs} title="Neues Mitglied hinzufügen"
       subTitle="Erfassen Sie hier die Mitgliedsdaten" width="2/5">

    <div class="flex items-center gap-4 mt-5">
        <Input bind:value={memberInput.name} title="Vorname" placeholder="Max" />

        <Input bind:value={memberInput.surname} title="Nachname" placeholder="Mustermann" />
    </div>

    <Input bind:value={memberInput.email} marginTop="5" title="E-Mail" placeholder="max.mustermann@email.com" />

    <Input bind:value={memberInput.phone} marginTop="5" title="Telefon" placeholder="01701234 5678" />

    <Input bind:value={memberInput.address} marginTop="5" title="Adresse" placeholder="Hauptstraße 1..." />
    <div class="w-full flex items-center gap-4 mt-5">
        <Dropdown onChange={(value) => memberInput.voice = value} title="Stimmlage"
                  options={["1. Tenor", "2. Tenor", "1. Bass", "2. Bass"]} />

        <Dropdown onChange={(value) => memberInput.status = value} title="Status" options={["Aktiv", "Passiv"]} />

        <Dropdown onChange={(value) => memberInput.role = value} title="Rolle"
                  options={["Mitglied", "Vorstand", "Schriftführer", "Chorleitung", "Notenwart"]} displayTop={true} />
    </div>

    <div class="w-full flex items-center gap-4 mt-5 max-[1700px]:flex-col">
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

<ConfirmDeleteModal expectedInput={memberName} id={menu.data.activeId}
                    title="Mitglied löschen" subTitle="Sind Sie sich sicher das Sie dieses Mitglied löschen möchten?"
                    action="deleteMember"
                    onClose={async () => {menu.data.open = false; menu.data.activeId = null; await fetchAndSetRaw();}}
                    bind:this={confirmDeleteMemberModal}
/>

<ContextMenu bind:open={menu.data.open} x={menu.data.x} y={menu.data.y}>
    <Button onclick={async () => await push(`/members/view?id=${menu.data.activeId}`)} type="contextMenu">
        Details
    </Button>
    <Button onclick={handleSwitchStatus} type="contextMenu">Status ändern</Button>
    <Button onclick={startDeleteMember} type="contextMenu" fontColor="text-gv-delete">Löschen</Button>
</ContextMenu>

<main class="flex overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="members"></DesktopSidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Mitglieder" subTitle="Verwaltung aller Vereinsmitglieder" showSlot={viewport.width > 1000}>
            {#if viewport.width > 1000}
                <Button type="primary" onclick={() => addMemberModal.showModal()}>
                    <span class="material-symbols-rounded text-icon-dt-4">add</span>
                    <p class="text-dt-4 text-nowrap">Mitglied hinzufügen</p>
                </Button>
            {/if}
        </PageHeader>

        {#if viewport.width <= 1000}
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
        {/if}

        <SearchBar placeholder="Mitglieder durchsuchen..." page="members" marginTop="5" />

        <Card padding="0" marginTop="5" borderThickness={viewport.width > 1300 ? "2" : "1"}>
            <div class="flex-1 min-h-0 overflow-y-auto w-full">
                {#if $membersStore.display.length !== 0}
                    {#if viewport.width > 1300}
                        <table class="w-full text-left border-gv-border">
                            <thead
                                class="sticky top-0 z-10 bg-white min-[1300px]:text-dt-4 text-dt-6 text-gv-dark-text">
                            <tr>
                                <th scope="col" class="px-6 py-3 font-bold">
                                    Name
                                </th>
                                <th scope="col" class="px-6 py-3 font-bold">
                                    Stimmlage
                                </th>
                                <th scope="col" class="px-6 py-3 font-bold">
                                    Kontakt
                                </th>
                                <th scope="col" class="px-6 py-3 font-bold text-nowrap">
                                    Mitglied seit
                                </th>
                                <th scope="col" class="px-6 py-3 font-bold">
                                    Status
                                </th>
                                <th scope="col" class="px-6 py-3">
                                    <button
                                        class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect"
                                        onclick={fetchAndSetRaw}
                                    >
                                        <span
                                            class="material-symbols-rounded min-[1300px]:text-icon-dt-5 text-icon-dt-6 font-bold text-gv-dark-text">refresh</span>
                                    </button>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {#each $membersStore.display as member}
                                <tr class="border-t-2 border-gv-border"
                                    oncontextmenu={(e) => menu.openFromEvent(e, member.id)}>
                                    <td class="px-6 py-4">
                                        <div class="flex flex-col items-start h-full overflow-hidden gap-1">
                                            <p class="min-[1300px]:text-dt-6 text-dt-7 text-gv-dark-text text-nowrap truncate">{`${member.name} ${member.surname}`}</p>
                                            <p class="min-[1300px]:text-dt-8 text-dt-8 text-gv-light-text text-nowrap truncate">{member.address}</p>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="min-[1300px]:text-dt-4 text-dt-7 text-gv-dark-text text-nowrap truncate">{voiceMap[member.voice]}</p>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex flex-col items-start  h-full overflow-hidden gap-2">
                                            <div class="flex items-center justify-start gap-2">
                                                <span
                                                    class="material-symbols-rounded min-[1300px]:text-icon-dt-6 text-icon-dt-7 text-gv-dark-turquoise">mail</span>
                                                <p class="min-[1300px]:text-dt-7 text-dt-8 text-gv-dark-turquoise">{member.email}</p>
                                            </div>
                                            <div class="flex items-center justify-start gap-2">
                                                <span
                                                    class="material-symbols-rounded min-[1300px]:text-icon-dt-6 text-icon-dt-7 text-gv-light-text">phone</span>
                                                <p class="min-[1300px]:text-dt-7 text-dt-8 text-gv-light-text">{member.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <p class="min-[1300px]:text-dt-4 text-dt-7 text-gv-dark-text text-nowrap truncate">{member.joined}</p>
                                    </td>
                                    <td class="px-6 py-4">
                                        <Chip text={statusMap[member.status]} />
                                    </td>
                                    <td class="px-6 py-4">
                                        <button
                                            class="flex items-center justify-center p-2 rounded-2 cursor-pointer hover:bg-gv-hover-effect"
                                            onclick={(e) => menu.openFromButton(e, member.id)}>
                                                    <span
                                                        class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">
                                                        more_horiz
                                                    </span>
                                        </button>
                                    </td>
                                </tr>
                            {/each}
                            </tbody>
                        </table>
                    {:else}
                        {#each $membersStore.display as member}
                            <button
                                class={`flex items-center w-full ${$membersStore.display.indexOf(member) !== $membersStore.display.length - 1 ? "border-b" : "border-none"} border-gv-border p-2`}
                                onclick={async () =>  await push(`/members/view?id=${member.id}`)}>
                                <div class="flex flex-col items-start justify-between mr-auto max-w-3/4">
                                    <p class="text-gv-dark-text text-dt-7">{`${member.name} ${member.surname}`}</p>
                                    <div class="flex items-center justify-start gap-2">
                                        <span class="material-symbols-rounded text-icon-dt-7 text-gv-dark-turquoise">mail</span>
                                        <p class="text-dt-8 text-gv-dark-turquoise text-nowrap truncate">{member.email}</p>
                                    </div>
                                </div>

                                <Chip text={statusMap[member.status]} fontSize="7" />
                            </button>
                        {/each}
                    {/if}
                {:else}
                    <p class="text-dt-3 text-gv-dark-text text-center w-full h-full p-10 font-semibold">Es wurden keine
                        Mitglieder gefunden!</p>
                {/if}
            </div>
        </Card>
    </div>
</main>
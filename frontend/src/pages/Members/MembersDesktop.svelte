<script>
    import { push } from "svelte-spa-router";
    import { get } from "svelte/store";
    import { logout } from "../../services/userService";
    import { membersStore } from "../../stores/members";
    import { addMember, updateStatus, roleMap, voiceMap, statusMap } from "../../services/members";
    import { addToast } from "../../stores/toasts";
    import { viewportWidth } from "../../stores/viewport";
    import { fetchAndSetRaw } from "../../services/filterService";

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
    let settingsModal = $state();
    let addMemberModal = $state();
    let confirmDeleteMemberModal = $state();

    // ADD MEMBER STATE
    let voiceInput = $state();
    let statusInput = $state();
    let roleInput = $state();
    let birthdayInput = $state();
    let joinedInput = $state();
    let nameInput = $state("");
    let surnameInput = $state("");
    let emailInput = $state("");
    let phoneInput = $state("");
    let addressInput = $state("");

    function resetAddInputs() {
        nameInput = "";
        surnameInput = "";
        emailInput = "";
        phoneInput = "";
        addressInput = "";
    }

    async function submitMember() {
        if (!birthdayInput || !joinedInput || !nameInput || !surnameInput || !emailInput || !phoneInput || !addressInput) return;
        if (voiceInput === "wählen" || statusInput === "wählen" || roleInput === "wählen") return;

        const resp = await addMember(nameInput, surnameInput, emailInput, phoneInput, addressInput, voiceMap[voiceInput], statusMap[statusInput], roleMap[roleInput], birthdayInput, joinedInput);

        if (resp.status === 200) {
            addToast({
                title: "Mitglied hinzugefügt",
                subTitle: "Das neue Mitglied wurde erfolgreich angelegt...",
                type: "success"
            });
        } else if (resp.status === 401) {
            addToast({
                title: "Ungültiges Token",
                subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen...",
                type: "error"
            });
            logout();
            await push("/?cpwErr=false");
            return;
        } else if (resp.status === 400) {
            addToast({
                title: "Eingaben unvollständig",
                subTitle: "Bitte überprüfen Sie Ihre Angaben...",
                type: "error"
            });
        } else if (resp.status === 409) {
            addToast({
                title: "Eingabe ungültig",
                subTitle: `Es gibt bereits einen Benutzer mit der E-Mail ${emailInput}.`,
                type: "error"
            });
        } else {
            addToast({
                title: "Interner Serverfehler",
                subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten.",
                type: "error"
            });
        }

        addMemberModal.hideModal();
        await fetchAndSetRaw();
    }

    // DELETE MEMBER STATE
    let memberName = $state("");
    let deleteMemberToast = {
        success: {
            title: "Mitglied gelöscht",
            subTitle: "Das Mitglied wurde erfolgreich entfernt.",
            type: "success"
        },
        notFound: {
            title: "Nicht gefunden",
            subTitle: "Das Mitglied konnte nicht gefunden werden.",
            type: "error"
        },
    };

    function startDeleteMember() {
        menuOpen = false;
        const membersRaw = get(membersStore).raw;
        let member = membersRaw.find(item => item.id === activeMemberId);

        memberName = `${member?.name} ${member?.surname}`;
        confirmDeleteMemberModal.startDelete();
    }

    // CONTEXT MENU STATE
    let menuOpen = $state(false);
    let menuX = $state(0);
    let menuY = $state(0);
    let activeMemberId = $state(null);

    function openContextMenu(event, memberId) {
        event.preventDefault();
        event.stopPropagation();
        activeMemberId = memberId;

        requestAnimationFrame(() => {
            menuX = Math.min(event.clientX, window.innerWidth - 200);
            menuY = Math.min(event.clientY, window.innerHeight - 150);
            menuOpen = true;
        });
    }

    function openContextMenuFromButton(event, memberId) {
        event.preventDefault();
        event.stopPropagation();
        activeMemberId = memberId;

        const rect = event.currentTarget.getBoundingClientRect();
        menuOpen = true;

        requestAnimationFrame(() => {
            const menuWidth = 170;
            const menuHeight = 150;
            menuX = rect.left - menuWidth;
            menuY = Math.min(rect.bottom, window.innerHeight - menuHeight);
        });
    }

    async function switchStatus() {
        const resp = await updateStatus(activeMemberId);
        if (resp.status === 200) {
            addToast({ title: "Status aktualisiert", subTitle: "Erfolgreich geändert.", type: "success" });
        } else if (resp.status === 401) {
            logout();
            await push("/?cpwErr=false");
            return;
        } else {
            addToast({ title: "Fehler", subTitle: "Ein Fehler ist aufgetreten.", type: "error" });
        }
        menuOpen = false;
        activeMemberId = null;
        await fetchAndSetRaw();
    }

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<svelte:window oncontextmenu={() => (menuOpen = false)} />

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<Modal bind:this={addMemberModal} extraFunction={resetAddInputs} title="Neues Mitglied hinzufügen"
       subTitle="Erfassen Sie hier die Mitgliedsdaten" width="2/5">
    <div class="flex items-center gap-4 mt-5">
        <Input bind:value={nameInput} title="Vorname" placeholder="Max" />
        <Input bind:value={surnameInput} title="Nachname" placeholder="Mustermann" />
    </div>
    <Input bind:value={emailInput} marginTop="5" title="E-Mail" placeholder="max.mustermann@email.com" />
    <Input bind:value={phoneInput} marginTop="5" title="Telefon" placeholder="01701234 5678" />
    <Input bind:value={addressInput} marginTop="5" title="Adresse" placeholder="Hauptstraße 1..." />
    <div class="w-full flex items-center gap-4 mt-5">
        <Dropdown onChange={(value) => voiceInput = value} title="Stimmlage"
                  options={["1. Tenor", "2. Tenor", "1. Bass", "2. Bass"]} />
        <Dropdown onChange={(value) => statusInput = value} title="Status" options={["Aktiv", "Passiv"]} />
        <Dropdown onChange={(value) => roleInput = value} title="Rolle"
                  options={["Mitglied", "Vorstand", "Schriftführer", "Chorleitung", "Notenwart"]} displayTop={true}/>
    </div>
    <div class="w-full flex items-center gap-4 mt-5 max-[1700px]:flex-col">
        <div class="flex flex-col items-start w-full">
            <p class="text-dt-6 font-medium mb-1">Geburtsdatum</p>
            <DefaultDatepicker onChange={(value) => birthdayInput = value} />
        </div>
        <div class="flex flex-col items-start w-full">
            <p class="text-dt-6 font-medium mb-1">Mitglied seit</p>
            <YearDatepicker onChange={(value) => joinedInput = value} />
        </div>
    </div>
    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button type="secondary" onclick={() => addMemberModal.hideModal()}>Abbrechen</Button>
        <Button type="primary" onclick={submitMember} isSubmit={true}>Hinzufügen</Button>
    </div>
</Modal>

<ConfirmDeleteModal expectedInput={memberName} id={activeMemberId}
                    title="Mitglied löschen" subTitle="Sicher löschen?"
                    toastMap={deleteMemberToast} action="deleteMember"
                    onClose={async () => {menuOpen = false; activeMemberId = null;}}
                    bind:this={confirmDeleteMemberModal}
/>

<ContextMenu bind:open={menuOpen} x={menuX} y={menuY}>
    <Button onclick={async () => await push(`/members/view?id=${activeMemberId}`)} type="contextMenu">Bearbeiten</Button>
    <Button onclick={switchStatus} type="contextMenu">Status ändern</Button>
    <Button onclick={startDeleteMember} type="contextMenu" fontColor="text-gv-delete">Löschen</Button>
</ContextMenu>

<main class="flex overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="members"></DesktopSidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Mitglieder" subTitle="Verwaltung" showSlot={$viewportWidth > 1000}>
            {#if $viewportWidth > 1000}
                <Button type="primary" onclick={() => addMemberModal.showModal()}>
                    <span class="material-symbols-rounded text-icon-dt-4">add</span>
                    <p class="text-dt-4 text-nowrap">Mitglied hinzufügen</p>
                </Button>
            {/if}
        </PageHeader>

        {#if $viewportWidth <= 1000}
            <div class="flex max-[430px]:flex-col w-full items-center justify-start gap-2 mt-4">
                <Button type="primary" onclick={addMemberModal.showModal}>
                    <span class="material-symbols-rounded text-icon-dt-5">add</span>
                    <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Mitglied hinzufügen</p>
                </Button>
                <Button type="primary" onclick={fetchAndSetRaw}>
                    <span class="material-symbols-rounded text-icon-dt-5">refresh</span>
                    <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Aktualisieren</p>
                </Button>
            </div>
        {/if}

        <SearchBar placeholder="Mitglieder durchsuchen..." page="members" marginTop="5"/>

        <Card padding="0" marginTop="5" borderThickness={$viewportWidth > 1300 ? "2" : "1"}>
            <div class="flex-1 min-h-0 overflow-y-auto w-full">
                {#if $membersStore.display.length !== 0}
                    {#if $viewportWidth > 1300}
                        <table class="w-full text-left border-gv-border">
                            <thead class="sticky top-0 z-10 bg-white min-[1300px]:text-dt-4 text-dt-6 text-gv-dark-text">
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
                                        <span class="material-symbols-rounded min-[1300px]:text-icon-dt-5 text-icon-dt-6 font-bold text-gv-dark-text">refresh</span>
                                    </button>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                                {#each $membersStore.display as member}
                                    <tr class="border-t-2 border-gv-border"
                                        oncontextmenu={(e) => openContextMenu(e, member.id)}>
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
                                                    <span class="material-symbols-rounded min-[1300px]:text-icon-dt-6 text-icon-dt-7 text-gv-dark-turquoise">mail</span>
                                                    <p class="min-[1300px]:text-dt-7 text-dt-8 text-gv-dark-turquoise">{member.email}</p>
                                                </div>
                                                <div class="flex items-center justify-start gap-2">
                                                    <span class="material-symbols-rounded min-[1300px]:text-icon-dt-6 text-icon-dt-7 text-gv-light-text">phone</span>
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
                                                onclick={(e) => openContextMenuFromButton(e, member.id)}>
                                                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">
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
                            <button class={`flex items-center w-full ${$membersStore.display.indexOf(member) !== $membersStore.display.length - 1 ? "border-b" : "border-none"} border-gv-border p-2`} onclick={async () =>  await push(`/members/view?id=${member.id}`)}>
                                <div class="flex flex-col items-start justify-between mr-auto max-w-3/4">
                                    <p class="text-gv-dark-text text-dt-7">{`${member.name} ${member.surname}`}</p>
                                    <div class="flex items-center justify-start gap-2">
                                        <span class="material-symbols-rounded text-icon-dt-7 text-gv-dark-turquoise">mail</span>
                                        <p class="text-dt-8 text-gv-dark-turquoise text-nowrap truncate">{member.email}</p>
                                    </div>
                                </div>

                                <Chip text={statusMap[member.status]} fontSize="7"/>
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
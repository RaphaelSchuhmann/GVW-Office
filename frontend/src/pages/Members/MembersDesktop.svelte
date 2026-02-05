<script>
    import { push } from "svelte-spa-router";
    import { get } from "svelte/store";
    import { logout } from "../../services/user";
    import { membersStore } from "../../stores/members";
    import { addMember, updateStatus, roleMap, voiceMap, statusMap } from "../../services/members";
    import { addToast } from "../../stores/toasts";
    import { viewportWidth } from "../../stores/viewport";

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

    /** @type {import("../../components/SettingsModal.svelte").default} */
    let settingsModal;

    let searchBar;

    // ADD MEMBER
    /** @type {import("../../components/Modal.svelte").default} */
    let addMemberModal;

    let voiceInput;
    let statusInput;
    let roleInput;
    let birthdayInput;
    let joinedInput;
    let nameInput = "";
    let surnameInput = "";
    let emailInput = "";
    let phoneInput = "";
    let addressInput = "";

    /**
     * Resets all input fields in the add member modal
     */
    function resetAddInputs() {
        nameInput = "";
        surnameInput = "";
        emailInput = "";
        phoneInput = "";
        addressInput = "";
    }

    /**
     * Submits a new member to the system with all form data
     * Validates inputs and handles API response with appropriate toast messages
     */
    async function submitMember() {
        if (!birthdayInput || !joinedInput || !nameInput || !surnameInput || !emailInput || !phoneInput || !addressInput) return;
        if (voiceInput === "wählen" || statusInput === "wählen" || roleInput === "wählen") return;

        const resp = await addMember(nameInput, surnameInput, emailInput, phoneInput, addressInput, voiceMap[voiceInput], statusMap[statusInput], roleMap[roleInput], birthdayInput, joinedInput);

        if (resp.status === 200) {
            addToast({
                title: "Mitglied hinzugefügt",
                subTitle: "Das neue Mitglied wurde erfolgreich angelegt und ist ab sofort in der Mitgliederübersicht verfügbar.",
                type: "success"
            });
        } else if (resp.status === 401) {
            // Auth token invalid / unauthorized
            addToast({
                title: "Ungültiges Token",
                subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
                type: "error"
            });
            logout();
            await push("/?cpwErr=false");
            return;
        } else if (resp.status === 400) {
            // user not found route back to log in
            addToast({
                title: "Eingaben unvollständig",
                subTitle: "Bitte überprüfen Sie Ihre Angaben. Einige Pflichtfelder sind entweder leer oder enthalten ungültige Werte.",
                type: "error"
            });
        } else if (resp.status === 409) {
            addToast({
                title: "Eingabe ungültig",
                subTitle: `Es gibt bereits einen Benutzer mit der E-Mail ${emailInput}. Bitte verwenden Sie eine andere E-Mail-Adresse.`,
                type: "error"
            });
        } else {
            // internal server error / unknown error
            addToast({
                title: "Interner Serverfehler",
                subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                type: "error"
            });
        }

        addMemberModal.hideModal();
        await searchBar.fetchData();
    }

    // DELETE MEMBER
    /** @type {import("../../components/ConfirmDeleteModal.svelte").default} */
    let confirmDeleteMemberModal;

    let memberName = "";
    let deleteMemberToast = {
        success: {
            title: "Mitglied gelöscht",
            subTitle: "Das Mitglied und der zugehörige Benutzeraccount wurden erfolgreich aus dem System entfernt.",
            type: "success"
        },
        notFound: {
            title: "Nicht gefunden",
            subTitle: "Das angegebene Mitglied oder der zugehörige Benutzer konnte nicht gefunden werden. Bitte versuchen Sie es später erneut.",
            type: "error"
        },
    };

    /**
     * Initiates the delete process for a member
     * Sets up the confirmation modal with member details
     */
    function startDeleteMember() {
        menuOpen = false;

        let membersRaw = get(membersStore).raw;
        let name = membersRaw.find(item => item.id === activeMemberId)?.name;
        let surname = membersRaw.find(item => item.id === activeMemberId)?.surname;

        memberName = `${name} ${surname}`;
        confirmDeleteMemberModal.startDelete();
    }

    // CONTEXT MENU
    let menuOpen = false;
    let menuX = 0;
    let menuY = 0;
    let activeMemberId = null;

    /**
     * Opens context menu on right-click at cursor position
     * @param {MouseEvent} event - The right-click event
     * @param {string} memberId - ID of the member being right-clicked
     */
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

    /**
     * Opens context menu from the three-dot button click
     * @param {MouseEvent} event - The button click event
     * @param {string} memberId - ID of the member whose button was clicked
     */
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

    /**
     * Toggles the status of a member between active and inactive
     * Handles API response and shows appropriate toast messages
     */
    async function switchStatus() {
        const resp = await updateStatus(activeMemberId);

        if (resp.status === 200) {
            addToast({
                title: "Status aktualisiert",
                subTitle: "Der Status des Mitglieds wurde erfolgreich geändert und im System übernommen.",
                type: "success"
            });
        } else if (resp.status === 401) {
            // Auth token invalid / unauthorized
            addToast({
                title: "Ungültiges Token",
                subTitle: "Ihr Authentifizierungstoken ist ungültig oder abgelaufen. Bitte melden Sie sich erneut an, um Zugriff zu erhalten.",
                type: "error"
            });
            logout();
            await push("/?cpwErr=false");
            return;
        } else if (resp.status === 404) {
            // member not found
            addToast({
                title: "Mitglied nicht gefunden",
                subTitle: "Das angegebene Mitglied konnte nicht gefunden werden. Bitte versuchen Sie es später erneut.",
                type: "error"
            });
        } else {
            // internal server error / unknown error
            addToast({
                title: "Interner Serverfehler",
                subTitle: "Beim Verarbeiten Ihrer Anfrage ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.",
                type: "error"
            });
        }
        menuOpen = false;
        activeMemberId = null;
        await searchBar.fetchData();
    }

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<svelte:window on:contextmenu={() => (menuOpen = false)} />

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<!-- Add member modal -->
<Modal bind:this={addMemberModal} extraFunction={resetAddInputs} title="Neues Mitglied hinzufügen"
       subTitle="Erfassen Sie hier die Mitgliedsdaten" width="2/5">
    <div class="flex items-center gap-4 mt-5">
        <Input bind:value={nameInput} title="Vorname" placeholder="Max" />
        <Input bind:value={surnameInput} title="Nachname" placeholder="Mustermann" />
    </div>
    <Input bind:value={emailInput} marginTop="5" title="E-Mail" placeholder="max.mustermann@email.com" />
    <Input bind:value={phoneInput} marginTop="5" title="Telefon" placeholder="01701234 5678" />
    <Input bind:value={addressInput} marginTop="5" title="Adresse" placeholder="Hauptstraße 1, 12345 Musterstadt" />
    <div class="w-full flex items-center gap-4 mt-5">
        <Dropdown onChange={(value) => voiceInput = value} title="Stimmlage"
                  options={["1. Tenor", "2. Tenor", "1. Bass", "2. Bass"]} />
        <Dropdown onChange={(value) => statusInput = value} title="Status" options={["Aktiv", "Passiv"]} />
        <Dropdown onChange={(value) => roleInput = value} title="Rolle"
                  options={["Mitglied", "Vorstand", "Schriftführer", "Chorleitung", "Notenwart"]} />
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
        <Button type="secondary" on:click={addMemberModal.hideModal}>Abbrechen</Button>
        <Button type="primary" on:click={submitMember} isSubmit={true}>Hinzufügen</Button>
    </div>
</Modal>

<!-- Confirm delete member modal -->
<ConfirmDeleteModal expectedInput={memberName} id={activeMemberId}
                    title="Mitglied löschen" subTitle="Sind Sie sich sicher das Sie dieses Mitglied löschen möchten?"
                    toastMap={deleteMemberToast} action="deleteMember"
                    onClose={async () => {menuOpen = false; activeMemberId = null; await searchBar.fetchData();}}
                    bind:this={confirmDeleteMemberModal}
/>

<ContextMenu bind:open={menuOpen} x={menuX} y={menuY}>
    <Button on:click={async () =>  await push(`/members/view?id=${activeMemberId}`)} type="contextMenu">Bearbeiten
    </Button>
    <Button on:click={switchStatus} type="contextMenu">Status ändern</Button>
    <Button on:click={startDeleteMember} type="contextMenu" fontColor="text-gv-delete">Löschen</Button>
</ContextMenu>

<main class="flex overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="members"></DesktopSidebar>
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Mitglieder" subTitle="Verwaltung aller Vereinsmitglieder" showSlot={$viewportWidth > 1000}>
            {#if $viewportWidth > 1000}
                <Button type="primary" on:click={addMemberModal.showModal}>
                    <span class="material-symbols-rounded text-icon-dt-4">add</span>
                    <p class="text-dt-4 text-nowrap">Mitglied hinzufügen</p>
                </Button>
            {/if}
        </PageHeader>

        {#if $viewportWidth <= 1000}
            <div class="flex max-[430px]:flex-col w-full items-center justify-start gap-2 mt-4">
                <Button type="primary" on:click={addMemberModal.showModal}>
                    <span class="material-symbols-rounded text-icon-dt-5">add</span>
                    <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Mitglied hinzufügen</p>
                </Button>
                <Button type="primary" on:click={searchBar.fetchData}>
                    <span class="material-symbols-rounded text-icon-dt-5">refresh</span>
                    <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Aktualisieren</p>
                </Button>
            </div>
        {/if}

        <SearchBar placeholder="Mitglieder durchsuchen..." page="members" marginTop="5" bind:this={searchBar} doDebounce={true} />

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
                                        on:click={searchBar.fetchData}>
                                        <span class="material-symbols-rounded min-[1300px]:text-icon-dt-5 text-icon-dt-6 font-bold text-gv-dark-text">refresh</span>
                                    </button>
                                </th>
                            </tr>
                            </thead>
                            <tbody>
                            {#if $membersStore.loading}
                                <tr class="border-t-2 border-gv-border">
                                    <td class="px-6 py-4">
                                        <div class="flex flex-col items-start h-full overflow-hidden gap-1">
                                            <div class="animate-pulse h-7 w-50 bg-gray-200 rounded"></div>
                                            <div class="animate-pulse h-5 w-40 bg-gray-200 rounded"></div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="animate-pulse h-7 w-30 bg-gray-200 rounded"></div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="flex flex-col items-start  h-full overflow-hidden gap-2">
                                            <div class="flex items-center justify-start gap-2">
                                            <span
                                                class="material-symbols-rounded text-icon-dt-6 text-gv-dark-turquoise">mail</span>
                                                <div class="animate-pulse h-5 w-40 bg-gray-200 rounded"></div>
                                            </div>
                                            <div class="flex items-center justify-start gap-2">
                                        <span
                                            class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">phone</span>
                                                <div class="animate-pulse h-5 w-40 bg-gray-200 rounded"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="animate-pulse h-7 w-30 bg-gray-200 rounded"></div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="animate-pulse h-7 w-20 bg-gray-200 rounded"></div>
                                    </td>
                                    <td class="px-6 py-4"></td>
                                </tr>
                            {:else}
                                {#each $membersStore.display as member}
                                    <tr class="border-t-2 border-gv-border"
                                        on:contextmenu={(e) => openContextMenu(e, member.id)}>
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
                                                on:click={(e) => openContextMenuFromButton(e, member.id)}>
                                                <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">
                                                    more_horiz
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            {/if}
                            </tbody>
                        </table>
                    {:else}
                        {#each $membersStore.display as member}
                            <button class={`flex items-center w-full ${$membersStore.display.indexOf(member) !== $membersStore.display.length - 1 ? "border-b" : "border-none"} border-gv-border p-2`} on:click={async () =>  await push(`/members/view?id=${member.id}`)}>
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
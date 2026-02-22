<script>
    import { push } from "svelte-spa-router";
    import { resetMemberPassword, updateMember } from "../../services/membersService";
    import { viewport } from "../../stores/viewport.svelte";
    import { roleMap, statusMap, voiceMap } from "../../services/membersService";

    import ToastStack from "../../components/ToastStack.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import SettingsModal from "../../components/SettingsModal.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import Button from "../../components/Button.svelte";
    import Input from "../../components/Input.svelte";
    import ConfirmDeleteModal from "../../components/ConfirmDeleteModal.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import YearDatepicker from "../../components/YearDatepicker.svelte";
    import DefaultDatepicker from "../../components/DefaultDatepicker.svelte";
    import { fetchAndSetRaw } from "../../services/filterService";

    let {
        memberData,
        isEditing = $bindable(),
        ...restProps
    } = $props();

    let draft = $state(null);

    function startEditing() {
        draft = JSON.parse(JSON.stringify(memberData));
        isEditing = true;
    }

    function cancelEditing() {
        draft = null;
        isEditing = false;
    }

    const hasChanges = $derived.by(() => {
        if (!draft || !memberData) return false;

        const requiredFields = ['name', 'surname', 'email', 'phone', 'address', 'voice', 'status', 'role', 'birthdate', 'joined'];
        const allFieldsFilled = requiredFields.every(field => {
            const value = draft[field];
            return value !== null && value !== undefined && String(value).trim() !== "";
        });

        const isDifferent = JSON.stringify(draft) !== JSON.stringify(memberData);

        return isDifferent && allFieldsFilled;
    });

    $effect.pre(() => {
        if (isEditing && !draft) {
            draft = JSON.parse(JSON.stringify(memberData));
        }
    });

    async function updateMemberData() {
        await updateMember($state.snapshot(draft));

        memberData = { ...draft };

        isEditing = false;
        draft = null;
    }

    async function routeToMembers() {
        await fetchAndSetRaw();
        await push("/members");
    }

    // ==================
    // MODAL REFERENCES
    // ==================
    /**
     * Reference to the global settings modal.
     * Used to programmatically open the application settings dialog.
     * @type {import("../../components/SettingsModal.svelte").default}
     */
    let settingsModal = $state();

    /**
     * Reference to the delete confirmation modal.
     * Used to initiate and confirm member deletion flow.
     * @type {import("../../components/ConfirmDeleteModal.svelte").default}
     */
    let confirmDeleteMemberModal = $state();

    function settingsClick() {
        settingsModal.showModal();
    }
</script>

<SettingsModal bind:this={settingsModal}></SettingsModal>
<ToastStack></ToastStack>

<ConfirmDeleteModal expectedInput={`${memberData.name} ${memberData.surname}`} id={memberData.id}
                    title="Mitglied löschen" subTitle="Sind Sie sich sicher das Sie dieses Mitglied löschen möchten?"
                    action="deleteMember"
                    onClose={async () => {await push("/members")}}
                    bind:this={confirmDeleteMemberModal}
/>

<main class="flex h-screen overflow-hidden">
    <DesktopSidebar onSettingsClick={settingsClick} currentPage="members"></DesktopSidebar>
    <div class="flex flex-col min-h-0 w-full p-10 overflow-hidden">
        <PageHeader title="Mitglied" subTitle={`Daten von "${memberData?.name ?? ""} ${memberData?.surname ?? ""}"`}>
            {#if viewport.width > 900}
                {#if !isEditing}
                    <Button type="secondary" onclick={async () => await routeToMembers()}>
                        <span class="material-symbols-rounded text-icon-dt-5">arrow_back</span>
                        <p class="ml-2 text-dt-3">Zurück</p>
                    </Button>
                {/if}
            {:else}
                <button
                    type="button"
                    class="cursor-pointer ml-auto hover:bg-gv-hover-effect flex items-center justify-center p-2 rounded-2"
                    onclick={async () => await routeToMembers()}
                >
                    <span class="material-symbols-rounded text-icon-dt-2">close</span>
                </button>
            {/if}
        </PageHeader>

        <div class="flex-1 min-h-0 overflow-y-auto w-full">
            <div class="flex flex-col items-center gap-5 min-[1500px]:w-1/2 min-[1200px]:w-2/3 w-full mt-5">
                {#if viewport.width < 900 && !isEditing}
                    <div class="flex items-center gap-2 w-full">
                        <Button type="delete" onclick={() => confirmDeleteMemberModal.startDelete()}>
                            <span class="material-symbols-rounded mr-2">delete</span>
                            Löschen
                        </Button>
                        <Button type="primary" onclick={() => startEditing()}>
                            <span class="material-symbols-rounded mr-2">person_edit</span>
                            Bearbeiten
                        </Button>
                    </div>
                    <div class="flex items-center w-full">
                        <Button type="secondary" onclick={async () => await resetMemberPassword(memberData.id)}>Passwort
                            Zurücksetzten
                        </Button>
                    </div>
                {/if}

                {#if !isEditing}
                    <div class="flex items-center gap-4 w-full max-[900px]:flex-col">
                        <Input
                            value={memberData.name}
                            title="Vorname"
                            readonly={!isEditing}
                        />
                        <Input
                            value={memberData.surname}
                            title="Nachname"
                            readonly={true}
                        />
                    </div>

                    <Input value={memberData.email} marginTop="5" title="E-Mail" placeholder="max.mustermann@email.com"
                           readonly={true} />
                    <Input value={memberData.phone} marginTop="5" title="Telefon" placeholder="01701234 5678"
                           readonly={true} />
                    <Input value={memberData.address} marginTop="5" title="Adresse" placeholder="Hauptstraße 1..."
                           readonly={true} />

                    <div class="w-full flex items-center gap-4 max-[900px]:flex-col">
                        <Input value={voiceMap[memberData.voice]} title="Stimmlage" readonly={true} />
                        <Input value={statusMap[memberData.status]} title="Status" readonly={true} />
                        <Input value={roleMap[memberData.role]} title="Rolle" readonly={true} />
                    </div>

                    <div class="w-full flex items-center gap-4 max-[900px]:flex-col">
                        <Input value={memberData.birthdate} title="Geburtsdatum" readonly={true} />
                        <Input value={memberData.joined} title="Mitglied seit" readonly={true} />
                    </div>
                {:else}
                    <div class="flex items-center gap-4 w-full max-[900px]:flex-col">
                        <Input
                            bind:value={draft.name}
                            title="Vorname"
                        />
                        <Input
                            bind:value={draft.surname}
                            title="Nachname"
                        />
                    </div>

                    <Input bind:value={draft.email} marginTop="5" title="E-Mail"
                           placeholder="max.mustermann@email.com" />
                    <Input bind:value={draft.phone} marginTop="5" title="Telefon" placeholder="01701234 5678" />
                    <Input bind:value={draft.address} marginTop="5" title="Adresse" placeholder="Hauptstraße 1..." />

                    <div class="w-full flex items-center gap-4 max-[900px]:flex-col">
                        <Dropdown onChange={(value) => draft.voice = value} selected={voiceMap[draft.voice]}
                                  title="Stimmlage"
                                  options={["1. Tenor", "2. Tenor", "1. Bass", "2. Bass"]} />

                        <Dropdown onChange={(value) => draft.status = value}
                                  selected={statusMap[draft.status]} title="Status"
                                  options={["Aktiv", "Passiv"]} />

                        <Dropdown onChange={(value) => draft.role = value} selected={roleMap[draft.role]}
                                  title="Rolle"
                                  options={["Mitglied", "Vorstand", "Schriftführer", "Chorleitung", "Notenwart"]} />
                    </div>

                    <div class="w-full flex items-center gap-4 max-[900px]:flex-col">
                        <div class="flex flex-col items-start w-full">
                            <p class="text-dt-6 font-medium mb-1">Geburtsdatum</p>
                            <DefaultDatepicker onChange={(value) => draft.birthdate = value}
                                               selected={draft.birthdate} />
                        </div>

                        <div class="flex flex-col items-start w-full">
                            <p class="text-dt-6 font-medium mb-1">Mitglied seit</p>
                            <YearDatepicker onChange={(value) => draft.joined = value} selected={draft.joined} />
                        </div>
                    </div>
                {/if}

                {#if viewport.width > 900 && !isEditing}
                    <div class="flex items-center gap-4 w-full">
                        <Button type="delete" onclick={() => confirmDeleteMemberModal.startDelete()}>
                            <span class="material-symbols-rounded mr-2">delete</span>
                            Löschen
                        </Button>
                        <Button type="primary" onclick={() => startEditing()}>
                            <span class="material-symbols-rounded mr-2">person_edit</span>
                            Bearbeiten
                        </Button>
                    </div>
                    <div class="flex items-center w-full">
                        <Button type="secondary" onclick={async () => await resetMemberPassword(memberData.id)}>Passwort
                            Zurücksetzten
                        </Button>
                    </div>
                {/if}

                {#if viewport.width > 900 && isEditing}
                    <div class="flex items-center w-full gap-2">
                        <Button type="secondary" onclick={() => cancelEditing()} isCancel={true}>Abbrechen</Button>
                        <Button type="primary" disabled={!hasChanges} onclick={async () => await updateMemberData()}>
                            Speichern
                        </Button>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</main>
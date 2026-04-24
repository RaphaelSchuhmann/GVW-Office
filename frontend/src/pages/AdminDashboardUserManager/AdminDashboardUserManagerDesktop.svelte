<script>
    import { userManagerStore } from "../../stores/userManager.svelte";
    import { addUser, roleMap } from "../../services/userService.svelte";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import HorizontalNavBar from "../../components/AdminHorizontalNavBar.svelte";
    import Button from "../../components/Button.svelte";
    import SearchBar from "../../components/SearchBar.svelte";
    import Filter from "../../components/Filter.svelte";
    import Card from "../../components/Card.svelte";
    import UserManagerListItem from "../../components/UserManagerListItem.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import Spinner from "../../components/Spinner.svelte";
    import { viewport } from "../../stores/viewport.svelte";

    /**
     * Reference to the "Add User" modal.
     * Controls visibility and lifecycle of the user creation dialog.
     * @type {import("../../components/Modal.svelte").default}
     */
    let addUserModal = $state();

    let isSubmitting = $state(false);

    let userInput = $state({
        name: "",
        email: "",
        phone: "",
        address: "",
        role: ""
    });

    /**
     * Derived flag determining whether the "Add User"
     * submit button should be disabled.
     *
     * Disabled if:
     * - Any required text field is empty
     * - Any dropdown has no valid selection
     *
     * Ensures basic client-side validation before submission.
     */
    const addDisabled = $derived.by(() => {
        const hasEmptyFields = [
            userInput.name, userInput.email, userInput.phone, userInput.address
        ].some(val => !val || val.trim() === "");

        const hasUnselectedDropdowns = [userInput.role].some(val => !val || val.toLowerCase() === "wählen");

        return hasEmptyFields || hasUnselectedDropdowns || isSubmitting;
    });

    /**
     * Resets all input fields of the "Add User" form
     * to their initial default values.
     *
     * Called after successful submission or when closing the modal.
     */
    function resetAddInputs() {
        userInput.name = "";
        userInput.email = "";
        userInput.phone = "";
        userInput.address = "";
        userInput.role = null;
    }

    async function submitUser() {
        isSubmitting = true;

        const user = {
            name: userInput.name,
            email: userInput.email,
            phone: userInput.phone,
            address: userInput.address,
            role: roleMap[userInput.role]
        };

        try {
            await addUser(user);
        } finally {
            isSubmitting = false;
        }

        addUserModal.hideModal();
    }
</script>

<ToastStack />

<Modal bind:this={addUserModal} extraFunction={resetAddInputs}
       title="Benutzer hinzufügen" subTitle="Erfassen Sie hier die Benutzerdaten">
    <div class="flex items-center gap-4 mt-5">
        <Input bind:value={userInput.name} title="Vorname" placeholder="Max" />
        
        <Input bind:value={userInput.email} title="E-Mail" placeholder="max.mustermann@email.com" />
    </div>

    <Input bind:value={userInput.phone} marginTop="5" title="Telefon" placeholder="01701234 5678" />

    <Input bind:value={userInput.address} marginTop="5" title="Adresse" placeholder="Hauptstraße 1..." />

    <Dropdown onChange={(value) => userInput.role = value} title="Rolle" marginTop="5"
                options={["Admin", "Mitglied", "Vorstand", "Schriftführer", "Chorleitung", "Notenwart"]} displayTop={true} />

    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button type="secondary" onclick={() => addUserModal.hideModal()}>Abbrechen</Button>
        <Button type="primary" disabled={addDisabled} onclick={submitUser} isSubmit={true}>
            {#if isSubmitting}
                <Spinner light={true} />
                <p>Speichern...</p>
            {:else}
                Hinzufügen
            {/if}
        </Button>
    </div>
</Modal>

<main class="flex h-screen overflow-hidden">
    <DesktopSidebar currentPage="adminDashboard"/>
    <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="flex flex-col w-full h-full flex-1 overflow-hidden p-10 min-h-0">
            <HorizontalNavBar currentPage="userManagement" />
            <PageHeader
                title="Nutzerverwaltung"
                subTitle=""
                hideSubTitle={true}
                marginTop="5"
            >
                {#if viewport.width > 1000}
                    <Button type="primary" onclick={addUserModal?.showModal}>
                        <span class="material-symbols-rounded text-icon-dt-4 mr-2">add</span>
                        <p class="text-dt-4 text-nowrap">Benutzer hinzufügen</p>
                    </Button>
                {/if}
            </PageHeader>

            {#if viewport.width <= 1000}
                <Button type="primary" onclick={addUserModal?.showModal} marginTop="4">
                    <span class="material-symbols-rounded text-icon-dt-5">add</span>
                    <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Benutzer hinzufügen</p>
                </Button>
            {/if}

            <div class="flex min-[1300px]:items-center max-[1300px]:flex-col w-full gap-2 mt-5">
                <SearchBar placeholder="Benutzer durchsuchen..." page="userManager" />
                <div class="min-[1300px]:w-1/4 w-full">
                    <Filter page="userManager" options={["Alle Rollen", "Admin", "Mitglied", "Vorstand", "Schriftführer", "Chorleitung", "Notenwart"]} textWrap={false} customDefault="Alle Rollen" />
                </div>
            </div>

            <Card padding="0" fillHeight={true} marginTop="2">
                {#each userManagerStore.display as user, i}
                    <UserManagerListItem 
                        id={user.id}
                        name={user.name} 
                        role={user.type}
                        email={user.email}
                        isOrphan={user.isOrphan}
                        isMobile={viewport.width <= 900}
                    />
                {/each}
            </Card>
        </div>
    </div>
</main>

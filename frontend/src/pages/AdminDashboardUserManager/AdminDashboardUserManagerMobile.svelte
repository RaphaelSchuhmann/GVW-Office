<script>
    import ToastStack from "../../components/ToastStack.svelte";
    import MobileSidebar from "../../components/MobileSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import HorizontalNavBar from "../../components/AdminHorizontalNavBar.svelte";
    import Button from "../../components/Button.svelte";
    import { viewport } from "../../stores/viewport.svelte";
    import SearchBar from "../../components/SearchBar.svelte";
    import Filter from "../../components/Filter.svelte";
    import { userManagerStore } from "../../stores/userManager.svelte";
    import Card from "../../components/Card.svelte";
    import UserManagerListItem from "../../components/UserManagerListItem.svelte";
    import { addUser, roleMap } from "../../services/userService.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import Spinner from "../../components/Spinner.svelte";

    let sidebarOpen = $state(false);

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
        userInput.role = "";
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

<ToastStack isMobile={true} />

<Modal bind:this={addUserModal} extraFunction={resetAddInputs} isMobile={true}
       title="Benutzer hinzufügen" subTitle="Erfassen Sie hier die Benutzerdaten">
    <Input bind:value={userInput.name} title="Name" placeholder="Max" />
    
    <Input bind:value={userInput.email} marginTop="5" title="E-Mail" placeholder="max.mustermann@email.com" />

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

<MobileSidebar currentPage="adminDashboard" bind:isOpen={sidebarOpen}/>

<main class="flex overflow-hidden h-screen">
    <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="flex flex-col w-full flex-1 overflow-hidden p-7 min-h-0 h-full">
            <div class="w-full flex items-center justify-start">
                <button class="flex items-center justify-center" onclick={() => (sidebarOpen = true)}>
                    <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">
                        menu
                    </span>
                </button>
            </div>
            <div class="mt-5">
                <HorizontalNavBar currentPage="userManagement" />
            </div>
            <PageHeader
                title="Nutzerverwaltung"
                subTitle=""
                showSlot={false}
                hideSubTitle={true}
                marginTop="5"
            />

            <Button type="primary" onclick={addUserModal?.showModal} marginTop="4">
                <span class="material-symbols-rounded text-icon-dt-5">add</span>
                <p class="text-dt-6 text-nowrap max-[430px]:ml-2">Benutzer hinzufügen</p>
            </Button>

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
                        isMobile={true}
                        isFirstItem={i === 0}
                    />
                {/each}
            </Card>
        </div>
    </div>
</main>

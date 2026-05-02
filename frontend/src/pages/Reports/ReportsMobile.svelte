<script>
    import { user } from "../../stores/user.svelte.js";
    import { viewport } from "../../stores/viewport.svelte";

    import ToastStack from "../../components/ToastStack.svelte";
    import DesktopSidebar from "../../components/DesktopSidebar.svelte";
    import PageHeader from "../../components/PageHeader.svelte";
    import SearchBar from "../../components/SearchBar.svelte";
    import Filter from "../../components/Filter.svelte";
    import Button from "../../components/Button.svelte";
    import ReportItem from "../../components/ReportItem.svelte";
    import Modal from "../../components/Modal.svelte";
    import Input from "../../components/Input.svelte";
    import Dropdown from "../../components/Dropdown.svelte";
    import { addReport, reportTypeMap } from "../../services/reportService.svelte.js";
    import Spinner from "../../components/Spinner.svelte";
    import { fetchAndSetRaw } from "../../services/filterService.svelte.js";
    import { reportsStore } from "../../stores/report.svelte.js";
    import { formatISODateString } from "../../services/dateTimeUtils.js";
    import MobileSidebar from "../../components/MobileSidebar.svelte";

    // ==================
    // MODAL REFERENCES
    // ==================
    /**
     * Reference to the add report modal.
     * Used to programmatically open the add report dialog.
     * @type {import("../../components/Modal.svelte").default}
     */
    let addReportModal = $state();

    // ==========
    // ADD REPORT
    // ==========
    let reportInputs = $state({
        title: "",
        type: "",
        description: ""
    });

    let isSubmitting = $state(false);

    const submitDisabled = $derived.by(() => {
        const hasEmptyFields = [
            reportInputs.title
        ].some(val => !val || val.trim() === "");

        const hasUnselectedDropdowns = [
            reportInputs.type
        ].some(val => !val || val.toLowerCase() === "wählen");

        return hasEmptyFields || hasUnselectedDropdowns || isSubmitting;
    });

    async function submitNewReport() {
        isSubmitting = true;

        if (!reportInputs.description) {
            reportInputs.description = "Keine Beschreibung";
        }

        let report = {
            title: reportInputs.title,
            description: reportInputs.description,
            type: reportInputs.type,
            author: user.name
        };

        try {
            await addReport(report);
        } finally {
            isSubmitting = false;
        }

        addReportModal.hideModal();
        await fetchAndSetRaw();
    }

    function resetInputs() {
        reportInputs.title = "";
        reportInputs.type = "";
        reportInputs.description = "";
    }

    let sidebarOpen = $state(false);
</script>

<ToastStack isMobile={true}/>

<Modal bind:this={addReportModal} extraFunction={resetInputs} isMobile={true}
       title="Bericht erstellen" subTitle="Geben Sie hier die Grunddaten des Berichts an.">
    <Input bind:value={reportInputs.title} title="Titel" placeholder="Titel" />
    <Dropdown title="Berichttyp" options={["Jahresbericht", "Protokoll", "Versammlungsbericht", "Sonstigerbericht"]}
              onChange={(val) => {reportInputs.type = reportTypeMap[val] || "other"}} marginTop="5"/>
    <Input bind:value={reportInputs.description} title="Beschreibung (Optional)" placeholder="Beschreibung"
           marginTop="5" />
    <div class="w-full flex items-center justify-end mt-5 gap-4">
        <Button type="secondary" onclick={() => addReportModal.hideModal()}>Abbrechen</Button>
        <Button type="primary" disabled={submitDisabled} onclick={submitNewReport} isSubmit={true}>
            {#if isSubmitting}
                <Spinner light={true} />
                <p>Speichern...</p>
            {:else}
                Hinzufügen
            {/if}
        </Button>
    </div>
</Modal>

<MobileSidebar currentPage="reports" bind:isOpen={sidebarOpen} />

<main class="flex overflow-hidden">
    <div class="flex flex-col w-full h-dvh overflow-hidden p-7 min-h-0">
        <div class="w-full flex items-center justify-start">
            <button class="flex items-center justify-center" onclick={() => sidebarOpen = true}>
                <span class="material-symbols-rounded text-icon-dt-4 text-gv-dark-text">menu</span>
            </button>
        </div>
        <PageHeader title="Berichte" subTitle="Verwaltung von Vereinsberichten" showSlot={false}></PageHeader>

        {#if user.role === "board_member" || user.role === "admin" || user.role === "secretary"}
            <div class="flex flex-col items-center w-full gap-2 mt-5">
                <Button type="primary" onclick={() => addReportModal.showModal()}>
                    <span class="material-symbols-rounded min-[1000px]:text-icon-dt-4 text-icon-dt-5 mr-2">add</span>
                    <p class="min-[1000px]:text-dt-4 text-dt-5 text-nowrap">Bericht erstellen</p>
                </Button>
            </div>
        {/if}

        <div class="flex flex-col w-full gap-4 mt-5">
            <SearchBar placeholder="Berichte durchsuchen..." page="reports" />
            <div class="h-full w-full">
                <Filter page="reports"
                        options={["Alle Typen", "Jahresbericht", "Protokoll", "Versammlungsbericht", "Sonstigerbericht"]}
                        textWrap={false} />
            </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto mt-5 flex flex-col items-center justify-start gap-2">
            {#each reportsStore.display as report}
                <ReportItem id={report.id} title={report.title} date={formatISODateString(report.createdAt)}
                            author={report.author} type={report.type} additionalText={report.description}
                            isMobile={true} deletable={false} />
            {/each}
        </div>
    </div>
</main>
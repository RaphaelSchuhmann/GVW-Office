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
</script>

<ToastStack />

<Modal bind:this={addReportModal} extraFunction={resetInputs}
       title="Bericht erstellen" subTitle="Geben Sie hier die Grunddaten des Berichts an.">
    <div class="flex items-center gap-4 w-full">
        <Input bind:value={reportInputs.title} title="Titel" placeholder="Titel" />
        <Dropdown title="Berichttyp" options={["Jahresbericht", "Protokoll", "Versammlungsbericht", "Sonstigerbericht"]}
                  onChange={(val) => {reportInputs.type = reportTypeMap[val] || "other"}} />
    </div>
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

<main class="flex overflow-hidden">
    <DesktopSidebar currentPage="reports" />
    <div class="flex flex-col w-full h-dvh overflow-hidden p-10 min-h-0">
        <PageHeader title="Berichte" subTitle="Verwaltung von Vereinsberichten"
                    showSlot={viewport.width > 1300}>
            {#if (user.role === "board_member" || user.role === "admin" || user.role === "secretary") && viewport.width > 1300}
                <Button type="primary" onclick={() => addReportModal.showModal()}>
                    <span class="material-symbols-rounded text-icon-dt-4 mr-2">add</span>
                    <p class="text-dt-4 text-nowrap">Bericht erstellen</p>
                </Button>
            {/if}
        </PageHeader>

        {#if (user.role === "board_member" || user.role === "admin" || user.role === "librarian" || user.role === "conductor") && viewport.width < 1300}
            <Button type="primary" onclick={() => addReportModal.showModal()}>
                <span class="material-symbols-rounded min-[1000px]:text-icon-dt-4 text-icon-dt-5 mr-2">add</span>
                <p class="min-[1000px]:text-dt-4 text-dt-5 text-nowrap">Bericht erstellen</p>
            </Button>
        {/if}

        <div class="flex min-[1300px]:items-center max-[1300px]:flex-col w-full gap-2 mt-5">
            <SearchBar placeholder="Berichte durchsuchen..." page="reports" />
            <div class="min-[1300px]:max-w-1/3 max-[1300px]:w-full">
                <Filter page="reports"
                        options={["Alle Typen", "Jahresbericht", "Protokoll", "Versammlungsbericht", "Sonstigerbericht"]}
                        textWrap={false} />
            </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto mt-5 flex flex-col items-center justify-start gap-2">
            {#each reportsStore.display as report}
                <ReportItem id={report.id} title={report.title} date={formatISODateString(report.createdAt)}
                            author={report.author} type={report.type} additionalText={report.description} />
            {/each}
        </div>
    </div>
</main>
<script>
    import { marginMap } from "../lib/dynamicStyles";
    import { onDestroy, onMount } from "svelte";
    import Dropdown from "./Dropdown.svelte";
    import Button from "./Button.svelte";

    export let selected = new Date().getDate();
    export let type = "default";
    export let marginTop = "";

    let open = false;
    let datepickerRef;

    let months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "July", "August", "September", "Oktober", "November", "Dezember"];
    let years = ["2025", "2026", "2027"]; // Automatically generated

    const validTypes = ["default", "year"];
    if (!validTypes.includes(type)) {
        console.warn(`Type ${type} is not a valid type`);
        type = "default";
    }

    function handleClickOutside(event) {
        if (datepickerRef && !datepickerRef.contains(event.target)) {
            open = false;
        }
    }

    function itemClick(date) {

    }

    onMount(() => {
        document.addEventListener("mousedown", handleClickOutside);
    });

    onDestroy(() => {
        document.removeEventListener("mousedown", handleClickOutside);
    });
</script>

<div class={`relative w-full ${marginMap[marginTop]}`} bind:this={datepickerRef}>
    <div class={`flex items-center w-full bg-gv-input-bg ${open ? "rounded-b-1" : "rounded-1"} gap-1`}>
        <input type="text" class="w-full p-2 pl-3 pr-3 rounded-l-1 text-gv-dark-text outline-gv-primary text-dt-6" placeholder={type === "default" ? "DD.MM.YYYY" : "YYYY"}>
        <button
            class="p-1.5 rounded-2 h-full aspect-square mr-1 flex items-center justify-center cursor-pointer hover:bg-gv-hover-effect"
            on:click={() => open = !open}>
            <span class="material-symbols-rounded text-icon-dt-6 text-gv-light-text">calendar_month</span>
        </button>
    </div>
    {#if open}
        <div class="absolute bottom-full w-full bg-gv-input-bg flex flex-col items-center rounded-t-1 z-999 p-2">
            <div class="w-full flex items-center justify-between">
                <button
                    class="flex items-center justify-center p-1.5 rounded-2 cursor-pointer hover:bg-gv-hover-effect">
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_left</span>
                </button>
                <div class="flex items-center gap-2">
                    {#if type === "default"}
                        <Dropdown selected="Dezember" bgWhite={true}
                                  options={months} padding="2"/>
                        <Dropdown selected={years[0]} bgWhite={true}
                                  options={years} padding="2"/>
                    {/if}
                </div>
                <button
                    class="flex items-center justify-center p-1.5 rounded-2 cursor-pointer hover:bg-gv-hover-effect">
                    <span class="material-symbols-rounded text-icon-dt-6 text-gv-dark-text">arrow_right</span>
                </button>
            </div>
            <div class="w-full flex items-center justify-end mt-5 gap-2">
                <Button type="secondary">Abbrechen</Button>
                <Button type="primary">Speichern</Button>
            </div>
        </div>
    {/if}
</div>
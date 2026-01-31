<script>
    import ProgressBarVisualizer from "./ProgressBarVisualizer.svelte";

    export let voice = "";
    export let voiceMembers = 0;
    export let totalMembers = 1;
    export let isMobile = false;
</script>

<div class="flex flex-col items-center justify-around w-full mt-10">
    <div class="flex items-center w-full mb-5">
        <p class={`text-gv-dark-text ${isMobile ? "text-dt-6" : "text-dt-5"} font-semibold`}>{voice}</p>
        <p class={`text-gv-light-text ${isMobile ? "text-dt-6" : "text-dt-5"} ml-auto`}>{`${voiceMembers}. Mitglieder`}</p>
    </div>
    <ProgressBarVisualizer value={voiceMembers} max={totalMembers}/>
</div>
<script>
    import { viewportWidth } from "../stores/viewport";
</script>

<svelte:window bind:innerWidth={$viewportWidth} />
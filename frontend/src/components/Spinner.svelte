<script>
    import Spinner_SVG from "../assets/Spinner_SVG.svg";

    let {
        title = "",
        subTitle = "",
        ...restProps
    } = $props();
</script>

<div class="flex flex-col items-center gap-5 w-1/5">
    <img src={Spinner_SVG} alt="spinner_svg" class="animate-spin w-3/5">
    {#if title}
        <div class="flex flex-col items-center">
            <p class="text-dt-1 text-gv-dark-turquoise text-center font-semibold">{title}</p>

            {#if subTitle}
                <p class="text-dt-3 text-gv-light-text text-center">{subTitle}</p>
            {/if}
        </div>
    {/if}
</div>

<script>
    import Form from "../components/Form.svelte";
    import Logo from "../assets/logo.svg";
</script>
<main class="bg-gv-bg-bar w-dvw h-dvh flex items-center justify-center">
    <Form>
        <img src={Logo} alt="Logo" class="w-1/6 rounded-full border-2 border-gv-border">
        <p class="font-semibold text-dt-1 mt-5">GVW Office</p>
        <p class="text-gv-light-text text-dt-3">Gesangverein Weppersdorf</p>
    </Form>
</main>
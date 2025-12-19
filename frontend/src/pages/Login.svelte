<script>
    import Form from "../components/Form.svelte";
    import Logo from "../assets/logo.svg";
    import Input from "../components/Input.svelte";
</script>
<main class="bg-gv-bg-bar w-dvw h-dvh flex items-center justify-center">
    <Form padding="10">
        <img src={Logo} alt="Logo" class="w-1/6 rounded-full border-2 border-gv-border">
        <p class="font-semibold text-dt-1 mt-5">GVW Office</p>
        <p class="text-gv-light-text text-dt-3">Gesangverein Weppersdorf</p>
        <Input type="email" placeholder="ihre.email@email.com" title="E-Mail" marginTop="5"/>
        <Input type="password" placeholder="" title="Passwort" marginTop="10"/>
    </Form>
</main>
<script>
    import Form from "../../components/Form.svelte";
    import Logo from "../../assets/logo.svg";
    import Button from "../../components/Button.svelte";
    import { push } from "svelte-spa-router";
</script>

<main class="bg-gv-bg-bar w-dvw h-dvh flex items-center justify-center">
    <div class="h-auto min-[1400px]:w-1/3 w-2/3">
        <Form padding="10" height="auto" width="full">
            <img
                src={Logo}
                alt="Logo"
                class="w-1/4 rounded-full border-2 border-gv-border"
            />
            <p class="font-semibold text-dt-1 mt-5 text-center">404</p>
            <p class="text-gv-dark-text text-dt-2 text-center">
                Seite nicht gefunden
            </p>

            <Button
                type="primary"
                marginTop="5"
                onclick={async () => await push("/dashboard")}
                isSubmit={true}
            >
                <span class="material-symbols-rounded">arrow_back</span>
                <p class="ml-3">Zurück zum Dashboard</p>
            </Button>
        </Form>
    </div>
</main>
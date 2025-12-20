<script>
    import { onMount } from "svelte";
    import { push } from "svelte-spa-router";
    import Form from "../components/Form.svelte";
    import Logo from "../assets/logo.svg";
    import Input from "../components/Input.svelte";
    import Button from "../components/Button.svelte";
    import ToastStack from "../components/ToastStack.svelte";
    import { login, authenticate } from "../services/auth.js";
    import { getValue, setValue } from "../services/store";

    let email = "";
    let password = "";

    onMount(async () => {
        let authToken = getValue("authToken");
        if (authToken) {
            let response = await authenticate(authToken);

            if (response) {
                setValue("email", response.email);
                setValue("role", response.role);
                if (response.changePassword) {
                    push(`/changePassword?firstLogin=${response.firstLogin}`);
                }

                push("/dashboard");
            }
        }
    });

    async function btnLogin() {
        // Ensure neither email nor password is empty
        if (!email) {
            // throw error that email cannot be empty
            return;
        }

        if (!password) {
            // throw error that password cannot be empty
            return;
        }

        // try to login
        let response = await login(email, password);
        
        if (!response) {
            // throw error internal server error (response is empty)
            return;
        }

        setValue("authToken", response.authToken);
        if (response.changePassword) {
            push(`/changePassword?firstLogin=${response.firstLogin}`);
        }

        push("/dashboard");
    }
</script>

<ToastStack></ToastStack>
<main class="bg-gv-bg-bar w-dvw h-dvh flex items-center justify-center">
    <Form padding="10" height="auto">
        <img
            src={Logo}
            alt="Logo"
            class="w-1/6 rounded-full border-2 border-gv-border"
        />
        <p class="font-semibold text-dt-1 mt-5 text-center">GVW Office</p>
        <p class="text-gv-light-text text-dt-3 text-center">
            Gesangverein Weppersdorf
        </p>
        <Input
            bind:value={email}
            type="email"
            placeholder="ihre.email@email.com"
            title="E-Mail"
            marginTop="5"
        />
        <Input
            bind:value={password}
            type="password"
            placeholder=""
            title="Passwort"
            marginTop="10"
        />
        <Button type="primary" marginTop="10" on:click={btnLogin}
            ><span class="material-symbols-rounded">login</span>
            <p class="ml-3">Anmelden</p></Button
        >
    </Form>
</main>

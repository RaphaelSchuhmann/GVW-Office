<script>
    import { onMount } from "svelte";
    import { innerWidth } from "svelte/reactivity/window";
    import { get } from "svelte/store";
    import { push } from "svelte-spa-router";
    import MemberViewerDesktop from "./MemberViewerDesktop.svelte";
    import MemberViewerMobile from "./MemberViewerMobile.svelte";
    import { membersStore } from "../../stores/members";
    import { loadUserData } from "../../services/user";

    let member = {
        name: "",
        surname: "",
        email: "",
        phone: "",
        address: "",
        voice: "",
        status: "",
        role: "",
        birthdate: "",
        joined: "",
        id: "",
    };

    onMount(async () => {
        await loadUserData();

        const hash = window.location.hash;
        const params = new URLSearchParams(hash.split("?")[1]);
        const memberId = params.get("id");

        if (!memberId) {
            await push("/members");
            return;
        }

        const members = get(membersStore);

        if (members.raw.length === 0) {
            await push("/members");
            return;
        }

        member = members.raw.find(m => m.id === memberId);

        if (!member) {
            await push("/members");
            return;
        }
    });
</script>

{#if innerWidth.current < 768}
    <MemberViewerMobile {member}/>
{:else}
    <MemberViewerDesktop {member}/>
{/if}
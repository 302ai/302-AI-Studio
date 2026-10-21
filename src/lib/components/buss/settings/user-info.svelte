<script lang="ts">
	import { SsoLogoutDialog, type SsoLogoutOptions } from "$lib/components/buss/sso-logout-dialog";
	import * as Avatar from "$lib/components/ui/avatar";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { persistedProviderState } from "$lib/stores/provider-state.svelte";
	import { userState } from "$lib/stores/user-state.svelte";
	import { DEFAULT_302AI_BASE_URL, get302AISsoOrigin } from "@shared/utils/302ai-base-url";

	let showLogoutDialog = $state(false);

	function handleLogoutClick() {
		showLogoutDialog = true;
	}

	async function handleLogoutConfirm(options: SsoLogoutOptions) {
		showLogoutDialog = false;
		await userState.logoutWithCleanup(options);
	}

	function handleLogoutClose() {
		showLogoutDialog = false;
	}

	function openWallet() {
		if (typeof window !== "undefined" && window.electronAPI?.externalLinkService) {
			// Same derivation as SSO login: use the domain matching the configured API base URL
			const provider = persistedProviderState.current.find((p) => p.apiType === "302ai");
			const baseUrl = provider?.baseUrl || DEFAULT_302AI_BASE_URL;
			const origin = get302AISsoOrigin(baseUrl);
			window.electronAPI.externalLinkService.openExternalLink(`${origin}/charge`);
		}
	}
</script>

{#if userState.isLoggedIn && userState.userInfo}
	<!-- User Info Section -->
	<div class="gap-settings-gap flex flex-col">
		<Label class="text-label-fg font-normal">{m.settings_user_info_label()}</Label>
		<div
			class="rounded-settings-item bg-settings-item-bg px-settings-item-x py-settings-item-y flex w-full items-center gap-4"
		>
			<!-- Avatar -->
			<Avatar.Root class="size-12 shrink-0">
				<Avatar.Image src={userState.userInfo.avatar} alt={userState.userInfo.user_name} />
				<Avatar.Fallback>{userState.userInfo.user_name.slice(0, 2)}</Avatar.Fallback>
			</Avatar.Root>

			<!-- User Details -->
			<div class="flex-1 min-w-0">
				<div class="text-sm font-semibold truncate">{userState.userInfo.user_name}</div>
				<div class="text-sm text-muted-foreground truncate">
					{#if userState.userInfo.email}
						{userState.userInfo.email}
					{:else if userState.userInfo.phone}
						{userState.userInfo.phone}
					{:else}
						UID: {userState.userInfo.uid}
					{/if}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-2 shrink-0">
				<Button
					variant="outline"
					size="sm"
					onclick={handleLogoutClick}
					class="dark:hover:bg-muted"
				>
					{m.settings_logout()}
				</Button>
			</div>
		</div>
	</div>

	<!-- Balance Section header - hidden for sub accounts, rows removed -->
	{#if !userState.userInfo.is_sub_account}
		<div class="gap-settings-gap flex flex-col">
			<div class="flex items-center justify-between">
				<Label class="text-label-fg font-normal">{m.settings_balance_usage()}</Label>
				<div class="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onclick={openWallet}
						class="dark:hover:bg-muted gap-1.5"
					>
						{m.settings_recharge()}
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Logout Dialog -->
	<SsoLogoutDialog
		bind:open={showLogoutDialog}
		userEmail={userState.userInfo?.email || userState.userInfo?.user_name || "User"}
		onConfirm={handleLogoutConfirm}
		onClose={handleLogoutClose}
	/>
{/if}

<script lang="ts">
	import { SsoLogoutDialog, type SsoLogoutOptions } from "$lib/components/buss/sso-logout-dialog";
	import * as Avatar from "$lib/components/ui/avatar";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { userState } from "$lib/stores/user-state.svelte";
	import { RefreshCw } from "@lucide/svelte";
	import { toast } from "svelte-sonner";

	let isRefreshing = $state(false);
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

	async function handleRefresh() {
		isRefreshing = true;
		try {
			const res = await userState.fetchUserInfo();
			if (res.success) {
				toast.success(m.login_success());
			} else {
				toast.error(res.error || "Failed to refresh");
			}
		} catch (_e) {
			toast.error(m.network_error());
		} finally {
			isRefreshing = false;
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
					size="icon-sm"
					onclick={handleRefresh}
					disabled={isRefreshing}
					class="dark:hover:bg-muted {isRefreshing ? 'animate-spin' : ''}"
				>
					<RefreshCw class="size-4" />
				</Button>
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

	<!-- Logout Dialog -->
	<SsoLogoutDialog
		bind:open={showLogoutDialog}
		userEmail={userState.userInfo?.email || userState.userInfo?.user_name || "User"}
		onConfirm={handleLogoutConfirm}
		onClose={handleLogoutClose}
	/>
{/if}

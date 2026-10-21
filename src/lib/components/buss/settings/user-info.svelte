<script lang="ts">
	import { SsoLogoutDialog, type SsoLogoutOptions } from "$lib/components/buss/sso-logout-dialog";
	import * as Avatar from "$lib/components/ui/avatar";
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import { Label } from "$lib/components/ui/label/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { userState } from "$lib/stores/user-state.svelte";
	import { CreditCard, LogOut, RefreshCw, Wallet } from "@lucide/svelte";
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
				toast.success(m.refresh_success());
			} else {
				toast.error(res.error || "Failed to refresh");
			}
		} catch (_e) {
			toast.error(m.network_error());
		} finally {
			isRefreshing = false;
		}
	}

	function openBalance() {
		window.electronAPI?.externalLinkService?.open302WebsiteLink("/dashboard/overview");
	}

	function openRecharge() {
		window.electronAPI?.externalLinkService?.open302WebsiteLink("/charge");
	}
</script>

{#if userState.isLoggedIn && userState.userInfo}
	<!-- User Info Section -->
	<div class="gap-settings-gap flex flex-col">
		<Label class="text-label-fg font-normal">{m.settings_user_info_label()}</Label>
		<Card.Root class="bg-settings-item-bg border-transparent gap-4 p-4 shadow-none">
			<!-- Row 1: User Details & Top Actions -->
			<div class="flex w-full items-center gap-4">
				<!-- Avatar -->
				<Avatar.Root class="size-12 shrink-0">
					<Avatar.Image src={userState.userInfo.avatar} alt={userState.userInfo.name} />
					<Avatar.Fallback>{(userState.userInfo.name || "U").slice(0, 2)}</Avatar.Fallback
					>
				</Avatar.Root>

				<!-- User Details -->
				<div class="flex-1 min-w-0">
					<div class="text-sm font-semibold truncate">
						{userState.userInfo.name}
					</div>
					<div class="text-sm text-muted-foreground truncate">
						{userState.userInfo.email}
					</div>
				</div>

				<!-- Actions -->
				<div class="flex items-center gap-2 shrink-0">
					<Button
						variant="secondary"
						size="icon-sm"
						onclick={handleRefresh}
						disabled={isRefreshing}
						class="dark:hover:bg-muted {isRefreshing ? 'animate-spin' : ''}"
					>
						<RefreshCw class="size-4" />
					</Button>
					<Button variant="secondary" size="sm" class="w-auto" onclick={openBalance}>
						<Wallet class="size-4" />
						<span>{m.settings_view_balance()}</span>
					</Button>
					<Button variant="default" size="sm" class="w-auto" onclick={openRecharge}>
						<CreditCard class="size-4" />
						<span>{m.settings_recharge()}</span>
					</Button>
				</div>
			</div>

			<!-- Row 2: Logout Action -->
			<div class="flex flex-row items-center">
				<Button variant="destructive" size="sm" class="w-full" onclick={handleLogoutClick}>
					<LogOut class="size-4" />
					<span>{m.settings_logout()}</span>
				</Button>
			</div>
		</Card.Root>
	</div>

	<!-- Logout Dialog -->
	<SsoLogoutDialog
		bind:open={showLogoutDialog}
		userEmail={userState.userInfo.email || userState.userInfo.name || "User"}
		onConfirm={handleLogoutConfirm}
		onClose={handleLogoutClose}
	/>
{/if}

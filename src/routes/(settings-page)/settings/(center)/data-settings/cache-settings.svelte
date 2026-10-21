<script lang="ts">
	import SettingInfoItem from "$lib/components/buss/settings/setting-info-item.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import Label from "$lib/components/ui/label/label.svelte";
	import { m } from "$lib/paraglide/messages.js";
	import { generalSettings } from "$lib/stores/general-settings.state.svelte";
	import { FolderOpen, RotateCcw } from "@lucide/svelte";
	import { createLogger } from "@shared/logger";
	import type { CacheInfo } from "@shared/storage/general-settings";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";

	const logger = createLogger("ui");

	let cacheInfo = $state<CacheInfo | null>(null);

	let isMigrating = $state(false);

	// Format bytes to human-readable size
	function formatBytes(bytes: number): string {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
	}

	async function loadCacheInfo() {
		try {
			cacheInfo = await generalSettings.getCacheInfo();
		} catch (error) {
			logger.error("Failed to load cache info:", error);
			toast.error(m.settings_cache_load_failed());
		}
	}

	async function handleSelectDirectory() {
		try {
			isMigrating = true;
			const selectedPath = await generalSettings.selectCacheDirectory();

			if (selectedPath) {
				toast.loading(m.settings_cache_migrating(), {
					description: selectedPath,
					duration: Infinity,
					id: "cache-migration",
				});

				const result = await generalSettings.setCacheDirectory(selectedPath);

				toast.dismiss("cache-migration");

				if (result.success) {
					toast.success(m.settings_cache_migrate_success(), {
						description: selectedPath,
					});
					await loadCacheInfo();
				} else {
					toast.error(m.settings_cache_migrate_failed(), {
						description: result.error || "Unknown error",
					});
				}
			}
		} catch (error) {
			toast.dismiss("cache-migration");
			logger.error("Failed to change cache directory:", error);
			toast.error(m.settings_cache_migrate_failed(), {
				description: error instanceof Error ? error.message : String(error),
			});
		} finally {
			isMigrating = false;
		}
	}

	async function handleResetToDefault() {
		try {
			isMigrating = true;
			toast.loading(m.settings_cache_resetting(), {
				duration: Infinity,
				id: "cache-reset",
			});

			await generalSettings.resetCacheToDefault();

			toast.dismiss("cache-reset");
			toast.success(m.settings_cache_reset_success());
			await loadCacheInfo();
		} catch (error) {
			toast.dismiss("cache-reset");
			logger.error("Failed to reset cache directory:", error);
			toast.error(m.settings_cache_reset_failed(), {
				description: error instanceof Error ? error.message : String(error),
			});
		} finally {
			isMigrating = false;
		}
	}

	// Load cache info on mount
	onMount(() => {
		loadCacheInfo();
	});
</script>

{#snippet directoryActions()}
	<div class="flex gap-2">
		<Button
			size="icon"
			variant="outline"
			class="size-8"
			title={m.settings_cache_reset_default()}
			onclick={handleResetToDefault}
			disabled={isMigrating}
		>
			<RotateCcw class="size-4" />
		</Button>
		<Button size="sm" onclick={handleSelectDirectory} disabled={isMigrating}>
			<FolderOpen class="size-4" />
			{m.settings_cache_select_directory()}
		</Button>
	</div>
{/snippet}

<div class="gap-settings-gap flex flex-col">
	<Label class="text-label-fg font-normal">{m.settings_cache_management()}</Label>

	<!-- Cache Directory Path -->
	<SettingInfoItem
		label={m.settings_cache_directory()}
		value={cacheInfo?.path || m.settings_cache_loading()}
		action={directoryActions}
	/>

	<!-- Cache Size -->
	{#if cacheInfo}
		<SettingInfoItem
			label={m.settings_cache_current_size()}
			value={formatBytes(cacheInfo.size)}
		/>
	{/if}
</div>

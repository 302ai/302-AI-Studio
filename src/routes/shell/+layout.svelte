<script lang="ts">
	import { m } from "$lib/paraglide/messages";
	import { tabBarState } from "$lib/stores/tab-bar-state.svelte";
	import { createLogger } from "@shared/logger";
	import type { ShortcutActionEvent } from "@shared/types/shortcut";
	import { ModeWatcher } from "mode-watcher";
	import { onMount } from "svelte";
	import "../../app.css";
	import TabBar from "./components/tab-bar/tab-bar.svelte";

	const logger = createLogger("ui");

	const { children } = $props();

	onMount(() => {
		const shortcutCleanup = window.electronAPI?.shortcut?.onShortcutAction?.(
			(event: ShortcutActionEvent) => {
				handleShortcutAction(event.action);
			},
		);

		return () => {
			shortcutCleanup?.();
		};
	});

	function handleShortcutAction(action: string) {
		switch (action) {
			case "newTab":
				handleNewTab();
				break;
			case "closeCurrentTab":
				handleCloseCurrentTab();
				break;
			case "closeOtherTabs":
				handleCloseOtherTabs();
				break;
			case "nextTab":
				handleNextTab();
				break;
			case "previousTab":
				handlePreviousTab();
				break;
			case "switchToTab1":
			case "switchToTab2":
			case "switchToTab3":
			case "switchToTab4":
			case "switchToTab5":
			case "switchToTab6":
			case "switchToTab7":
			case "switchToTab8":
			case "switchToTab9":
				handleSwitchToTab(parseInt(action.replace("switchToTab", "")) - 1);
				break;
			case "openSettings":
				handleOpenSettings();
				break;
			default:
				logger.error("ShortcutService: Unknown action", action);
				// Other actions handled by chat-specific or sidebar-specific handlers
				break;
		}
	}

	function handleNewTab() {
		tabBarState.handleNewTab(m.title_new_chat());
	}

	function handleCloseCurrentTab() {
		const activeTab = tabBarState.tabs.find((t) => t.active);
		if (activeTab) {
			tabBarState.handleTabClose(activeTab.id);
		}
	}

	function handleCloseOtherTabs() {
		const activeTab = tabBarState.tabs.find((t) => t.active);
		if (activeTab) {
			tabBarState.handleTabCloseOthers(activeTab.id);
		}
	}

	function handleNextTab() {
		const tabs = tabBarState.tabs;
		if (tabs.length <= 1) return;

		const currentIndex = tabs.findIndex((t) => t.active);
		const nextIndex = (currentIndex + 1) % tabs.length;
		tabBarState.handleActivateTab(tabs[nextIndex].id);
	}

	function handlePreviousTab() {
		const tabs = tabBarState.tabs;
		if (tabs.length <= 1) return;

		const currentIndex = tabs.findIndex((t) => t.active);
		const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
		tabBarState.handleActivateTab(tabs[prevIndex].id);
	}

	function handleSwitchToTab(index: number) {
		const tabs = tabBarState.tabs;
		if (index >= 0 && index < tabs.length) {
			tabBarState.handleActivateTab(tabs[index].id);
		}
	}

	function handleOpenSettings() {
		window.electronAPI.windowService.handleOpenSettingsWindow();
	}
</script>

<ModeWatcher />

<div class="flex w-screen h-screen flex-col">
	<TabBar />

	<main class="flex-1">
		{@render children?.()}
	</main>
</div>

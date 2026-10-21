<script lang="ts">
	import ButtonWithTooltip from "$lib/components/buss/button-with-tooltip/button-with-tooltip.svelte";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import Switch from "$lib/components/ui/switch/switch.svelte";
	import { m } from "$lib/paraglide/messages";
	import { generalSettings } from "$lib/stores/general-settings.state.svelte";
	import { cn } from "$lib/utils";
	import { isOpenClawBundledSkill } from "$lib/utils/skill";
	import { Ellipsis, Loader2, Star, Zap } from "@lucide/svelte";
	import type { Skill } from "@shared/types";

	interface Props {
		skill: Skill;
		isBuiltin: boolean;
		is_favorite?: boolean;
		isUsed?: boolean;
		downloading?: boolean;
		favoriteLoading?: boolean;
		selectable?: boolean;
		selected?: boolean;
		onSelect?: (skill: Skill) => void;
		onSelectionChange?: (skill: Skill, selected: boolean) => void;
		onUse?: (skill: Skill) => void;
		onRemove?: (skill: Skill) => void;
		onEdit?: (skill: Skill) => void;
		onDownload?: (skill: Skill) => void;
		onDelete?: (skill: Skill) => void;
		onFavoriteToggle?: (skill: Skill) => void;
		onForceUseToggle?: (skill: Skill, forceUse: boolean) => void;
	}

	const {
		skill,
		isBuiltin,
		is_favorite = false,
		isUsed = false,
		downloading = false,
		favoriteLoading = false,
		selectable = false,
		selected = false,
		onSelect,
		onSelectionChange,
		onUse,
		onRemove,
		onEdit,
		onDownload,
		onDelete,
		onFavoriteToggle,
		onForceUseToggle,
	}: Props = $props();

	// Built-in skills cannot be edited or deleted, only downloaded
	const isOpenClawBundled = $derived(isOpenClawBundledSkill(skill));
	const canDownload = $derived(!isOpenClawBundled && !!onDownload);
	const canEdit = $derived(!isBuiltin && !isOpenClawBundled && !!onEdit);
	const canDelete = $derived(!isBuiltin && !isOpenClawBundled && !!onDelete);
	const showFavoriteButton = $derived(!!onFavoriteToggle);
	const showMenu = $derived(canEdit || canDownload || canDelete);
	const showActionArea = $derived(showFavoriteButton || showMenu);
	let isHovered = $state(false);

	const description = $derived(
		generalSettings.language === "zh" && skill.description_zh
			? skill.description_zh
			: skill.description,
	);

	const skillTags = $derived.by(() => {
		const tags: string[] = [];
		if (isBuiltin) {
			tags.push(m.skills_builtin());
		}
		if (isOpenClawBundled) {
			tags.push(m.skills_openclaw_bundled());
		}
		return tags;
	});

	const shouldShowFavoriteButton = $derived(is_favorite || isHovered);

	function handleCardClick() {
		// Always go to detail page when clicking the card
		onSelect?.(skill);
	}

	function handleCheckboxChange(checked: boolean) {
		onSelectionChange?.(skill, checked);
	}

	function handleUseClick(e: MouseEvent) {
		e.stopPropagation();
		onUse?.(skill);
	}

	function handleRemoveClick(e: MouseEvent) {
		e.stopPropagation();
		onRemove?.(skill);
	}

	function handleFavoriteClick(e: MouseEvent) {
		e.stopPropagation();
		onFavoriteToggle?.(skill);
	}

	function handleForceUseChange(checked: boolean) {
		onForceUseToggle?.(skill, checked);
	}
</script>

<button
	type="button"
	class={cn(
		"group relative flex h-full w-full cursor-pointer flex-col rounded-xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
		selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
	)}
	onclick={handleCardClick}
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	<!-- Selection Checkbox -->
	{#if selectable}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm border border-border overflow-hidden"
			onclick={(e) => e.stopPropagation()}
		>
			<Checkbox checked={selected} onCheckedChange={handleCheckboxChange} class="h-6 w-6" />
		</div>
	{/if}

	<!-- Header: Icon + Info + Menu -->
	<div class="mb-4 flex items-start gap-3">
		<!-- Icon Container -->
		<div
			class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
		>
			<Zap class="h-5 w-5" />
		</div>
		<!-- Info Section -->
		<div class="flex min-w-0 flex-1 flex-col gap-1">
			<div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
				<div class="flex min-w-0 min-h-7 items-center">
					<h3
						class="min-w-0 truncate font-semibold leading-tight text-foreground"
						title={skill.name}
					>
						{skill.name}
					</h3>
				</div>
				{#if showActionArea}
					<div class="grid h-7 shrink-0 grid-cols-[1.75rem_1.75rem] items-center gap-1">
						{#if showFavoriteButton}
							<ButtonWithTooltip
								tooltip={is_favorite
									? m.title_button_unstar()
									: m.title_button_star()}
								variant="ghost"
								size="icon"
								disabled={favoriteLoading}
								class={cn(
									"size-7 transition-opacity hover:!bg-transparent",
									shouldShowFavoriteButton
										? "opacity-100"
										: "opacity-0 group-hover:opacity-100",
								)}
								onclick={handleFavoriteClick}
							>
								{#if favoriteLoading}
									<Loader2 class="h-4 w-4 animate-spin text-muted-foreground" />
								{:else}
									<Star
										class={cn(
											"h-4 w-4",
											is_favorite
												? "fill-star-favorite text-star-favorite"
												: "fill-star-unfavorite-inactive text-star-unfavorite-inactive",
										)}
									/>
								{/if}
							</ButtonWithTooltip>
						{:else}
							<div aria-hidden="true" class="size-7"></div>
						{/if}

						{#if showMenu}
							<div class="size-7 shrink-0">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										<Button
											variant="ghost"
											size="icon-sm"
											class="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
										>
											<Ellipsis class="h-4 w-4" />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-32">
										{#if canEdit}
											<DropdownMenu.Item onclick={() => onEdit?.(skill)}>
												{m.text_button_edit()}
											</DropdownMenu.Item>
										{/if}
										{#if canDownload}
											<DropdownMenu.Item
												disabled={downloading}
												onclick={() => onDownload?.(skill)}
												class={downloading ? "opacity-50" : ""}
											>
												{#if downloading}
													<Loader2 class="mr-2 h-4 w-4 animate-spin" />
												{/if}
												{m.skills_download()}
											</DropdownMenu.Item>
										{/if}
										{#if canDelete}
											<DropdownMenu.Item
												class="text-destructive"
												onclick={() => onDelete?.(skill)}
											>
												{m.text_button_delete()}
											</DropdownMenu.Item>
										{/if}
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						{:else}
							<div aria-hidden="true" class="size-7"></div>
						{/if}
					</div>
				{/if}
			</div>
			{#if skillTags.length > 0}
				<div class="flex flex-wrap items-center gap-1.5">
					{#each skillTags as tag (tag)}
						<Badge
							variant="secondary"
							class="w-fit px-1.5 py-0.5 text-[10px] font-medium"
						>
							{tag}
						</Badge>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Body: Description -->
	<div class="mb-4 flex-1">
		<p class="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
			{description}
		</p>
	</div>

	<!-- Footer: Status + Action -->
	<div class="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-2 pt-3">
		{#if isUsed}
			<!-- Status Indicator -->
			<div class="mr-auto text-xs font-medium">
				<span class="flex items-center gap-1.5 text-primary">
					<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span>
					{m.text_label_model_enabled()}
				</span>
			</div>
			<!-- Force Use Toggle -->
			{#if onForceUseToggle}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="flex items-center gap-2" onclick={(e) => e.stopPropagation()}>
					<span class="text-xs text-muted-foreground">{m.skills_force_use()}</span>
					<Switch
						checked={skill.forceUse ?? false}
						onCheckedChange={handleForceUseChange}
						class="border-border"
					/>
				</div>
			{/if}
			{#if onRemove}
				<Button
					variant="ghost"
					size="sm"
					class="h-8 px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
					onclick={handleRemoveClick}
				>
					{m.skills_remove()}
				</Button>
			{/if}
		{:else if onUse}
			<Button size="sm" class="h-8 px-4" onclick={handleUseClick}>
				{m.skills_use()}
			</Button>
		{/if}
	</div>
</button>

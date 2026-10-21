<script lang="ts">
	import { page } from "$app/state";
	import { IconPicker } from "$lib/components/buss/icon-picker/index.js";
	import { ModelDialog } from "$lib/components/buss/model-dialog/index.js";
	import { ModelList } from "$lib/components/buss/model-list/index.js";
	import { SettingSwitchItem } from "$lib/components/buss/settings/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { persistedModelState, providerState } from "$lib/stores/provider-state.svelte.js";
	import { userState } from "$lib/stores/user-state.svelte";
	import { getFilteredModels } from "$lib/utils/model-filters.js";
	import { Eye, EyeOff } from "@lucide/svelte";
	import { createLogger } from "@shared/logger";
	import type { Model, ModelCreateInput, ModelProvider } from "@shared/types";
	import { toast } from "svelte-sonner";

	const logger = createLogger("ui");

	const apiTypes = [
		{ value: "302ai", label: "302.AI" },
		{ value: "openai", label: "OpenAI" },
		{ value: "anthropic", label: "Anthropic" },
		{ value: "gemini", label: "Google Gemini" },
		// { value: "azure", label: "Azure OpenAI" },
		// { value: "ollama", label: "Ollama" },
		// { value: "custom", label: m.common_custom() },
	];

	function getChatEndpointUrl(baseUrl: string, apiType: string): string {
		const cleanBaseUrl = baseUrl.replace(/\/$/, "");

		switch (apiType.toLowerCase()) {
			case "openai":
			case "302ai":
				if (cleanBaseUrl.endsWith("/v1")) {
					return `${cleanBaseUrl}/chat/completions`;
				}
				return `${cleanBaseUrl}/v1/chat/completions`;
			case "anthropic":
				return `${cleanBaseUrl}/v1/messages`;
			case "gemini":
			case "google":
				return `${cleanBaseUrl}/v1beta/generateContent`;
			default:
				if (cleanBaseUrl.endsWith("/v1")) {
					return `${cleanBaseUrl}/chat/completions`;
				}
				return `${cleanBaseUrl}/v1/chat/completions`;
		}
	}

	let isLoadingModels = $state(false);
	let searchQuery = $state("");
	let showModelDialog = $state(false);
	let dialogMode = $state<"add" | "edit">("add");
	let editingModel = $state<Model | undefined>(undefined);
	let pendingRemovedIds = $state<Set<string>>(new Set());

	const providerParam = $derived(page.params.provider);
	const currentProvider = $derived(
		providerParam ? providerState.getProviderByNameOrId(providerParam) : undefined,
	);
	let showApiKey = $state(false);

	// 使用统一的过滤方法：对于 302AI provider，只包含 isFeatured === true 或 isAddedByUser === true 的模型；其他 provider 不应用过滤
	const sortedModels = $derived.by(() => {
		return getFilteredModels(persistedModelState.current).sort((a, b) =>
			a.name.localeCompare(b.name),
		);
	});

	let formData = $derived.by<ModelProvider>(() => {
		if (currentProvider) {
			return {
				id: currentProvider.id,
				name: currentProvider.name,
				apiType: currentProvider.apiType,
				apiKey: currentProvider.apiKey,
				baseUrl: currentProvider.baseUrl,
				enabled: currentProvider.enabled,
				custom: currentProvider.custom || false,
				status: currentProvider.status,
				websites: { ...currentProvider.websites },
				icon: currentProvider.icon,
				autoUpdateModels: currentProvider.autoUpdateModels || false,
			};
		}

		return {
			id: "",
			name: "",
			apiType: "openai",
			apiKey: "",
			baseUrl: "",
			enabled: true,
			custom: false,
			status: "pending",
			websites: {
				official: "",
				apiKey: "",
				docs: "",
				models: "",
				defaultBaseUrl: "",
			},
			icon: undefined,
			autoUpdateModels: false,
		};
	});

	// 为 baseUrl 和 apiKey 创建独立的输入状态
	let baseUrlInput = $state("");
	let apiKeyInput = $state("");
	let baseUrlDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let apiKeyDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// 记录上一次的 provider ID，用于检测切换
	let lastProviderId = $state<string>("");

	// 只在切换 Provider 时同步一次，不使用响应式 $effect
	$effect(() => {
		if (currentProvider && currentProvider.id !== lastProviderId) {
			// Provider 切换了，同步数据
			baseUrlInput = currentProvider.baseUrl;
			apiKeyInput = currentProvider.apiKey;
			lastProviderId = currentProvider.id;
		}
	});

	// baseUrl 防抖保存函数
	function handleBaseUrlInput(event: Event) {
		const target = event.target as HTMLInputElement;
		baseUrlInput = target.value;

		// 清除之前的定时器
		if (baseUrlDebounceTimer) {
			clearTimeout(baseUrlDebounceTimer);
		}

		// 设置新的防抖定时器 - 延长到 1000ms
		baseUrlDebounceTimer = setTimeout(async () => {
			if (formData.id) {
				await providerState.updateProvider(formData.id, {
					baseUrl: baseUrlInput,
				});
			}
			// 清除定时器引用
			baseUrlDebounceTimer = null;
		}, 1000);
	}

	// apiKey 防抖保存函数
	function handleApiKeyInput(event: Event) {
		const target = event.target as HTMLInputElement;
		apiKeyInput = target.value;

		// 清除之前的定时器
		if (apiKeyDebounceTimer) {
			clearTimeout(apiKeyDebounceTimer);
		}

		// 设置新的防抖定时器 - 延长到 1000ms
		apiKeyDebounceTimer = setTimeout(async () => {
			if (formData.id) {
				await providerState.updateProvider(formData.id, {
					apiKey: apiKeyInput,
				});
			}
			// 清除定时器引用
			apiKeyDebounceTimer = null;
		}, 1000);
	}

	async function saveFormData() {
		if (formData.id) {
			await providerState.updateProvider(formData.id, {
				name: formData.name,
				apiType: formData.apiType,
				apiKey: apiKeyInput,
				baseUrl: baseUrlInput, // 使用 baseUrlInput 而不是 formData.baseUrl
				enabled: formData.enabled,
				custom: formData.custom,
				status: formData.status,
				websites: formData.websites,
				icon: formData.icon,
				autoUpdateModels: formData.autoUpdateModels,
			});
		}
	}

	async function handleIconChange(iconKey: string) {
		formData.icon = iconKey;
		await saveFormData();
	}

	async function handleGetModels() {
		if (!currentProvider) {
			return;
		}
		isLoadingModels = true;

		// 先保存 baseUrl 的最新值
		if (baseUrlDebounceTimer) {
			clearTimeout(baseUrlDebounceTimer);
			baseUrlDebounceTimer = null;
		}

		// 同时保存 apiKey 的最新值
		if (apiKeyDebounceTimer) {
			clearTimeout(apiKeyDebounceTimer);
			apiKeyDebounceTimer = null;
		}

		if (formData.id) {
			await providerState.updateProvider(formData.id, {
				baseUrl: baseUrlInput,
				apiKey: apiKeyInput,
			});
		}

		// 再保存其他表单数据，确保使用最新的 API key
		clearTimeout(saveTimeout);
		await saveFormData();

		const success = await providerState.fetchModelsForProvider(currentProvider);

		// After successfully fetching models, apply default model if needed
		// This ensures users don't have to manually select a model
		if (success) {
			await providerState.applyDefaultModelIfNeeded(currentProvider);
		}

		isLoadingModels = false;
	}

	function fillApiKeyFromAccount() {
		// The SSO callback returns the actual API key that should be used
		const apiKeyToUse = userState.ssoApiKey;
		if (apiKeyToUse) {
			apiKeyInput = apiKeyToUse;

			// 立即保存，不使用防抖
			if (formData.id) {
				providerState.updateProvider(formData.id, {
					apiKey: apiKeyInput,
				});
			}

			toast.success(m.text_provider_update_success({ name: formData.name }));
		}
	}

	function handleAddModel() {
		dialogMode = "add";
		editingModel = undefined;
		showModelDialog = true;
	}

	function handleModelEdit(model: Model) {
		dialogMode = "edit";
		editingModel = model;
		showModelDialog = true;
	}

	async function handleModelDelete(model: Model) {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		pendingRemovedIds = new Set(pendingRemovedIds).add(model.id);
		providerState.scheduleRemoveModel(model.id);
	}

	function handleDialogClose() {
		showModelDialog = false;
		editingModel = undefined;
	}

	async function handleDialogSave(data: Model | ModelCreateInput) {
		if (!currentProvider) return;

		try {
			if (dialogMode === "add") {
				// 确保传递 isAddedByUser 字段
				const createInput: ModelCreateInput = {
					id: data.id,
					name: data.name,
					remark: data.remark,
					providerId: currentProvider.id,
					capabilities: data.capabilities,
					type: data.type,
					custom: true,
					enabled: data.enabled,
					collected: false,
					isAddedByUser: true,
				};
				const newModel = await providerState.addModel(createInput);

				toast.success(m.text_model_add_success({ name: newModel.name }));
			} else if (editingModel) {
				const success = await providerState.updateModel(editingModel.id, {
					id: data.id,
					name: data.name,
					remark: data.remark,
					type: data.type,
					enabled: data.enabled,
					capabilities: data.capabilities,
				});

				if (success) {
					toast.success(m.text_model_update_success({ name: data.name }));
				} else {
					toast.error(m.text_model_update_failed());
				}
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "An error occurred";
			toast.error(message);
		}
	}

	function handleModelToggleCollected(model: Model) {
		providerState.toggleModelCollected(model.id);
	}

	function handleModelDuplicate(model: Model) {
		if (!currentProvider) return;
		let newId = `${model.id}_copy`;
		let counter = 1;
		while (persistedModelState.current.find((m) => m.id === newId)) {
			newId = `${model.id}_copy_${counter}`;
			counter++;
		}
		logger.debug("Model capabilities:", model.capabilities);
		providerState.addModel({
			id: newId,
			name: `${model.name} (Copy)`,
			remark: model.remark ? `${model.remark} (Copy)` : "",
			providerId: currentProvider.id,
			capabilities: new Set(model.capabilities),
			type: model.type,
			custom: true,
			enabled: model.enabled,
			collected: false,
		});
	}

	async function handleClearModels() {
		if (!currentProvider) return;
		// 在清空前统计过滤后的模型数量，与获取时显示的数量保持一致
		const providerModels = persistedModelState.current.filter(
			(m) => m.providerId === currentProvider.id,
		);
		const filteredCount =
			currentProvider.id === "302AI"
				? getFilteredModels(providerModels).length
				: providerModels.length;
		const clearedCount = await providerState.clearModelsByProvider(currentProvider.id);
		if (clearedCount > 0) {
			toast.success(
				m.text_clear_models_success({
					count: filteredCount.toString(),
				}),
			);
		}
	}

	let saveTimeout: NodeJS.Timeout;
	function handleInputChange() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveFormData();
		}, 500);
	}
	const filteredModels = $derived(
		sortedModels
			.filter((m) => m.providerId === currentProvider?.id)
			.filter(
				(model) =>
					searchQuery === "" ||
					model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
					model.name.toLowerCase().includes(searchQuery.toLowerCase()),
			)
			.filter((m) => !pendingRemovedIds.has(m.id)),
	);

	// 页面加载时自动更新模型（异步执行，不阻塞页面渲染）
	// onMount(() => {
	// 	if (currentProvider?.autoUpdateModels && currentProvider.apiKey) {
	// 		// 使用 setTimeout 将更新操作推迟到下一个事件循环
	// 		// 让页面先完成渲染，避免切换标签页时卡顿
	// 		setTimeout(() => {
	// 			handleGetModels();
	// 		}, 0);
	// 	}
	// });
</script>

<div class="flex h-full min-w-0 flex-1 flex-col overflow-hidden p-6">
	<!-- 配置标题 -->
	<div class="mb-6 flex flex-shrink-0 flex-col gap-1">
		<h2 class="max-w-full break-all whitespace-normal">
			{m.text_provider_configure({
				name:
					formData.name ||
					(formData.custom ? m.text_provider_custom_name() : m.text_provider_unnamed()),
			})}
		</h2>
	</div>

	<div class="flex min-h-0 flex-1 flex-col gap-6">
		<!-- 表单 -->
		<div class="flex-shrink-0 space-y-4">
			{#if formData.custom}
				<!-- 图标和名称（自定义供应商） -->
				<div class="flex items-end gap-4">
					<div class="flex flex-col gap-2">
						<Label class="text-sm font-normal">{m.text_label_provider_icon()}</Label>
						<IconPicker
							value={formData.icon || formData.apiType}
							onChange={handleIconChange}
						/>
					</div>
					<div class="flex flex-1 flex-col gap-2">
						<Label for="name" class="text-sm font-medium"
							>{m.text_label_provider_name()}</Label
						>
						<Input
							id="name"
							bind:value={formData.name}
							placeholder={m.placeholder_input_provider_name()}
							oninput={handleInputChange}
							class="rounded-settings-item bg-settings-item-bg hover:ring-ring h-11 hover:ring-1"
						/>
					</div>
				</div>
			{/if}

			<!-- Base URL -->
			<div class="space-y-2">
				<Label for="baseUrl">{m.text_label_provider_base_url()}</Label>
				<Input
					id="baseUrl"
					value={baseUrlInput}
					placeholder={formData.custom ? m.placeholder_input_provider_base_url() : ""}
					oninput={handleBaseUrlInput}
					class="rounded-settings-item bg-settings-item-bg hover:ring-ring hover:ring-1"
				/>
				{#if baseUrlInput}
					<p class="text-muted-foreground max-w-full break-all text-xs">
						{m.text_base_url_request_info({
							url: getChatEndpointUrl(baseUrlInput, formData.apiType),
						})}
					</p>
				{/if}
				{#if formData.apiType === "302ai"}
					<p class="text-muted-foreground text-xs">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- domains is hardcoded, no XSS risk -->
						{@html m.text_base_url_302ai_domains_hint({
							domains: `<span class="text-primary font-medium">「 https://api.302ai.cn, https://api.302ai.com, https://api.302.ai 」</span>`,
						})}
					</p>
				{/if}
			</div>

			<!-- API Key -->
			<div class="space-y-2">
				<Label for="apiKey">{m.text_label_provider_api_key()}</Label>
				<div class="relative">
					<Input
						id="apiKey"
						type={showApiKey ? "text" : "password"}
						value={apiKeyInput}
						placeholder={m.placeholder_input_provider_api_key()}
						class="rounded-settings-item bg-settings-item-bg hover:ring-ring pr-10 hover:ring-1"
						oninput={handleApiKeyInput}
					/>
					<Button
						variant="ghost"
						size="sm"
						class="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
						onclick={() => (showApiKey = !showApiKey)}
					>
						{#if showApiKey}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</Button>
				</div>
				{#if !formData.custom && formData.websites.apiKey}
					<p class="text-muted-foreground flex items-center gap-2 text-xs">
						<a
							href={formData.websites.apiKey}
							target="_blank"
							class="text-primary hover:underline"
							onclick={(e) => {
								e.preventDefault();
								window.electronAPI.externalLinkService.openExternalLink(
									formData.websites.apiKey,
								);
							}}
						>
							{m.text_get_api_key()}
						</a>
						{#if formData.id === "302AI"}
							<span class="text-muted-foreground/50">|</span>
							{#if userState.isLoggedIn}
								<button
									class="text-primary cursor-pointer hover:underline"
									onclick={fillApiKeyFromAccount}
								>
									<!-- @ts-expect-error - text_use_account_api_key may not exist in all locales -->
									{m.text_use_account_api_key()}
								</button>
							{:else}
								<a
									href="/settings/account-settings"
									class="text-primary hover:underline"
								>
									{m.text_login_to_get_api_key()}
								</a>
							{/if}
						{/if}
					</p>
				{/if}
			</div>

			<!-- 自动更新模型 -->
			<div class="space-y-2">
				<Label class="text-sm font-normal"
					>{m.text_label_provider_auto_update_models()}</Label
				>
				<SettingSwitchItem
					label={m.text_label_provider_auto_update_models_desc()}
					checked={formData.autoUpdateModels}
					onCheckedChange={(v) => {
						formData.autoUpdateModels = v;
						saveFormData();
					}}
				/>
			</div>

			<!-- 接口类型 (仅自定义供应商) -->
			{#if formData.custom}
				<div class="space-y-2">
					<Label for="apiType">{m.text_label_provider_interface_type()}</Label>
					<Select.Root
						type="single"
						bind:value={formData.apiType}
						onValueChange={(value) => {
							formData.apiType = (value as ModelProvider["apiType"]) || "openai";
							saveFormData();
						}}
					>
						<Select.Trigger class="rounded-settings-item bg-settings-item-bg w-full">
							{apiTypes.find((t) => t.value === formData.apiType)?.label ||
								m.placeholder_select_provider_interface_type()}
						</Select.Trigger>
						<Select.Content>
							{#each apiTypes as type (type.value)}
								<Select.Item value={type.value} label={type.label} />
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			<!-- 操作按钮 -->
			<div class="@container flex flex-wrap items-center gap-3 pt-4">
				<Button variant="default" onclick={handleGetModels} disabled={isLoadingModels}>
					{isLoadingModels
						? m.text_button_get_models_loading()
						: m.text_button_get_models()}
				</Button>
				<Button variant="outline" onclick={handleAddModel}
					>{m.text_button_add_model()}</Button
				>
				<Button
					variant="destructive"
					onclick={handleClearModels}
					disabled={filteredModels.length === 0}
				>
					{m.text_button_clear_models()}
				</Button>
				<div class="@[600px]:flex-1 @[600px]:block hidden"></div>
				<Input
					bind:value={searchQuery}
					placeholder={m.placeholder_input_search_model()}
					class="rounded-settings-item bg-settings-item-bg! hover:ring-ring @[600px]:max-w-xs w-full @[600px]:w-auto min-w-0 hover:ring-1"
				/>
			</div>
		</div>

		<!-- 模型列表区域 -->
		<div class="min-h-0 w-full flex-1">
			<ModelList
				models={filteredModels}
				onModelEdit={handleModelEdit}
				onModelDelete={handleModelDelete}
				onModelToggleCollected={handleModelToggleCollected}
				onModelDuplicate={handleModelDuplicate}
			/>
		</div>
	</div>
</div>

<!-- Model Dialog -->
<ModelDialog
	bind:open={showModelDialog}
	mode={dialogMode}
	model={editingModel}
	providerId={currentProvider?.id || ""}
	onClose={handleDialogClose}
	onSave={handleDialogSave}
/>

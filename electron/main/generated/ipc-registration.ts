import { ipcMain } from "electron";
import {
	broadcastService,
	storageService,
	generalSettingsService,
	ssoService,
	ghostWindowService,
	shortcutService,
	localVibeService,
	codeAgentService,
	windowService,
	deepLinkService,
	threadStateService,
	tabService,
	aiApplicationService,
	appService,
	cloudModeService,
	dataService,
	devLauncherService,
	externalLinkService,
	loggerService,
	mcpService,
	notificationService,
	openClawService,
	providerService,
	threadService,
	updaterService,
} from "../services";

/**
 * Auto-generated IPC service interfaces
 */
export function registerIpcHandlers() {
	// broadcastService service registration
	ipcMain.handle("broadcastService:broadcastExcludeSource", (event, broadcastEvent, data) =>
		broadcastService.broadcastExcludeSource(event, broadcastEvent, data),
	);
	ipcMain.handle("broadcastService:broadcastToAll", (event, broadcastEvent, data) =>
		broadcastService.broadcastToAll(event, broadcastEvent, data),
	);

	// storageService service registration
	ipcMain.handle("storageService:setItem", (event, key, value) =>
		storageService.setItem(event, key, value),
	);
	ipcMain.handle("storageService:getItem", (event, key) => storageService.getItem(event, key));
	ipcMain.handle("storageService:hasItem", (event, key) => storageService.hasItem(event, key));
	ipcMain.handle("storageService:removeItem", (event, key, options) =>
		storageService.removeItem(event, key, options),
	);
	ipcMain.handle("storageService:getKeys", (event, base) => storageService.getKeys(event, base));
	ipcMain.handle("storageService:clear", (event, base) => storageService.clear(event, base));
	ipcMain.handle("storageService:getMeta", (event, key) => storageService.getMeta(event, key));
	ipcMain.handle("storageService:setMeta", (event, key, metadata) =>
		storageService.setMeta(event, key, metadata),
	);
	ipcMain.handle("storageService:removeMeta", (event, key) =>
		storageService.removeMeta(event, key),
	);
	ipcMain.handle("storageService:getItems", (event, keys) =>
		storageService.getItems(event, keys),
	);
	ipcMain.handle("storageService:setItems", (event, items) =>
		storageService.setItems(event, items),
	);
	ipcMain.handle("storageService:watch", (event, watchKey) =>
		storageService.watch(event, watchKey),
	);
	ipcMain.handle("storageService:unwatch", (event, watchKey) =>
		storageService.unwatch(event, watchKey),
	);

	// generalSettingsService service registration
	ipcMain.handle("generalSettingsService:handleLanguageChanged", (event, language) =>
		generalSettingsService.handleLanguageChanged(event, language),
	);
	ipcMain.handle("generalSettingsService:handleProxyChanged", (event, proxySettings) =>
		generalSettingsService.handleProxyChanged(event, proxySettings),
	);
	ipcMain.handle("generalSettingsService:testProxyConnection", (event, proxySettings) =>
		generalSettingsService.testProxyConnection(event, proxySettings),
	);
	ipcMain.handle("generalSettingsService:getCacheDirectory", (event) =>
		generalSettingsService.getCacheDirectory(event),
	);
	ipcMain.handle("generalSettingsService:setCacheDirectory", (event, dirPath) =>
		generalSettingsService.setCacheDirectory(event, dirPath),
	);
	ipcMain.handle("generalSettingsService:getCacheInfo", (event) =>
		generalSettingsService.getCacheInfo(event),
	);
	ipcMain.handle("generalSettingsService:clearCache", (event) =>
		generalSettingsService.clearCache(event),
	);
	ipcMain.handle("generalSettingsService:resetCacheToDefault", (event) =>
		generalSettingsService.resetCacheToDefault(event),
	);
	ipcMain.handle("generalSettingsService:selectCacheDirectory", (event) =>
		generalSettingsService.selectCacheDirectory(event),
	);

	// ssoService service registration
	ipcMain.handle("ssoService:openSsoLogin", (event, serverPort, language) =>
		ssoService.openSsoLogin(event, serverPort, language),
	);
	ipcMain.handle("ssoService:waitForSsoCallback", (event, timeoutMs) =>
		ssoService.waitForSsoCallback(event, timeoutMs),
	);
	ipcMain.handle("ssoService:cancelSsoLogin", (event) => ssoService.cancelSsoLogin(event));

	// ghostWindowService service registration
	ipcMain.handle("ghostWindowService:startTracking", (event) =>
		ghostWindowService.startTracking(event),
	);
	ipcMain.handle("ghostWindowService:stopTracking", (event) =>
		ghostWindowService.stopTracking(event),
	);
	ipcMain.handle("ghostWindowService:updateInsertIndex", (event, target) =>
		ghostWindowService.updateInsertIndex(event, target),
	);

	// shortcutService service registration
	ipcMain.handle("shortcutService:init", (event, shortcuts) =>
		shortcutService.init(event, shortcuts),
	);
	ipcMain.handle("shortcutService:updateShortcuts", (event, shortcuts) =>
		shortcutService.updateShortcuts(event, shortcuts),
	);
	ipcMain.handle("shortcutService:getConflicts", (event) => shortcutService.getConflicts(event));
	ipcMain.handle("shortcutService:getSyncInfo", (event) => shortcutService.getSyncInfo(event));

	// localVibeService service registration
	ipcMain.handle("localVibeService:copyToWorkspaceByIpc", (event, sourcePath, containerPath) =>
		localVibeService.copyToWorkspaceByIpc(event, sourcePath, containerPath),
	);
	ipcMain.handle("localVibeService:getComposeDirectory", (event) =>
		localVibeService.getComposeDirectory(event),
	);
	ipcMain.handle("localVibeService:openComposeDirectory", (event) =>
		localVibeService.openComposeDirectory(event),
	);
	ipcMain.handle("localVibeService:openWorkspaceDirectory", (event, subPath) =>
		localVibeService.openWorkspaceDirectory(event, subPath),
	);
	ipcMain.handle("localVibeService:getLocalBaseUrl", (event) =>
		localVibeService.getLocalBaseUrl(event),
	);
	ipcMain.handle("localVibeService:getSandboxStatus", (event) =>
		localVibeService.getSandboxStatus(event),
	);
	ipcMain.handle("localVibeService:triggerSystemRestart", (event) =>
		localVibeService.triggerSystemRestart(event),
	);
	ipcMain.handle("localVibeService:validPodman", (event) => localVibeService.validPodman(event));
	ipcMain.handle("localVibeService:startPodmanHealthCheck", (event) =>
		localVibeService.startPodmanHealthCheck(event),
	);
	ipcMain.handle("localVibeService:installWSL", (event) => localVibeService.installWSL(event));
	ipcMain.handle("localVibeService:installScoop", (event) =>
		localVibeService.installScoop(event),
	);
	ipcMain.handle("localVibeService:installHomebrew", (event) =>
		localVibeService.installHomebrew(event),
	);
	ipcMain.handle("localVibeService:installPodman", (event) =>
		localVibeService.installPodman(event),
	);
	ipcMain.handle("localVibeService:initPodmanMachine", (event) =>
		localVibeService.initPodmanMachine(event),
	);
	ipcMain.handle("localVibeService:stopLocalSandboxByIpc", (event) =>
		localVibeService.stopLocalSandboxByIpc(event),
	);
	ipcMain.handle("localVibeService:ensureLocalSandboxRunning", (event) =>
		localVibeService.ensureLocalSandboxRunning(event),
	);
	ipcMain.handle("localVibeService:startPodmanMachine", (event) =>
		localVibeService.startPodmanMachine(event),
	);
	ipcMain.handle("localVibeService:restartPodmanMachine", (event) =>
		localVibeService.restartPodmanMachine(event),
	);
	ipcMain.handle("localVibeService:updateOpenclawModels", (event) =>
		localVibeService.updateOpenclawModels(event),
	);

	// codeAgentService service registration
	ipcMain.handle(
		"codeAgentService:updateClaudeCodeSandboxModel",
		(event, threadId, sandbox_id, llm_model) =>
			codeAgentService.updateClaudeCodeSandboxModel(event, threadId, sandbox_id, llm_model),
	);
	ipcMain.handle("codeAgentService:checkClaudeCodeSandbox", (event, sandboxId) =>
		codeAgentService.checkClaudeCodeSandbox(event, sandboxId),
	);
	ipcMain.handle("codeAgentService:updateClaudeCodeSandboxesByIpc", (event) =>
		codeAgentService.updateClaudeCodeSandboxesByIpc(event),
	);
	ipcMain.handle("codeAgentService:updateClaudeCodeSessions", (event, sandboxId) =>
		codeAgentService.updateClaudeCodeSessions(event, sandboxId),
	);
	ipcMain.handle(
		"codeAgentService:updateClaudeCodeCurrentSessionIdByThreadId",
		(event, threadId, sessionId) =>
			codeAgentService.updateClaudeCodeCurrentSessionIdByThreadId(event, threadId, sessionId),
	);
	ipcMain.handle("codeAgentService:updateClaudeCodeSandboxRemark", (event, sandbox_id, remark) =>
		codeAgentService.updateClaudeCodeSandboxRemark(event, sandbox_id, remark),
	);
	ipcMain.handle(
		"codeAgentService:updateClaudeCodeSandboxThinkingBudget",
		(event, sandbox_id, maxThinkingToken) =>
			codeAgentService.updateClaudeCodeSandboxThinkingBudget(
				event,
				sandbox_id,
				maxThinkingToken,
			),
	);
	ipcMain.handle(
		"codeAgentService:createClaudeCodeSandboxByIpc",
		(event, threadId, sandboxName, maxThinkingToken) =>
			codeAgentService.createClaudeCodeSandboxByIpc(
				event,
				threadId,
				sandboxName,
				maxThinkingToken,
			),
	);
	ipcMain.handle("codeAgentService:deleteClaudeCodeSandboxByIpc", (event, sandbox_id) =>
		codeAgentService.deleteClaudeCodeSandboxByIpc(event, sandbox_id),
	);
	ipcMain.handle("codeAgentService:deleteClaudeCodeSession", (event, sandbox_id, session_id) =>
		codeAgentService.deleteClaudeCodeSession(event, sandbox_id, session_id),
	);
	ipcMain.handle("codeAgentService:findClaudeCodeSandboxWithValidDisk", (event, threadId) =>
		codeAgentService.findClaudeCodeSandboxWithValidDisk(event, threadId),
	);
	ipcMain.handle("codeAgentService:addClaudeCodeSandboxMCP", (event, sandboxId, MCPInfos, mode) =>
		codeAgentService.addClaudeCodeSandboxMCP(event, sandboxId, MCPInfos, mode),
	);
	ipcMain.handle(
		"codeAgentService:createThreadForSession",
		(
			event,
			threadId,
			sandboxId,
			sessionId,
			sandboxRemark,
			llmModel,
			sessionNote,
			workspacePath,
		) =>
			codeAgentService.createThreadForSession(
				event,
				threadId,
				sandboxId,
				sessionId,
				sandboxRemark,
				llmModel,
				sessionNote,
				workspacePath,
			),
	);
	ipcMain.handle("codeAgentService:getThreadIdBySessionId", (event, sandboxId, sessionId) =>
		codeAgentService.getThreadIdBySessionId(event, sandboxId, sessionId),
	);
	ipcMain.handle(
		"codeAgentService:setIsManualNoteBySession",
		(event, sandboxId, sessionId, isManualNote) =>
			codeAgentService.setIsManualNoteBySession(event, sandboxId, sessionId, isManualNote),
	);
	ipcMain.handle("codeAgentService:deleteWorkspaceDirectory", (event, subPath) =>
		codeAgentService.deleteWorkspaceDirectory(event, subPath),
	);
	ipcMain.handle("codeAgentService:renameWorkspaceDirectory", (event, oldSubPath, newSubPath) =>
		codeAgentService.renameWorkspaceDirectory(event, oldSubPath, newSubPath),
	);

	// windowService service registration
	ipcMain.handle("windowService:handleOpenSettingsWindow", (event, route) =>
		windowService.handleOpenSettingsWindow(event, route),
	);
	ipcMain.handle("windowService:handleNavigateToUrl", (event, title, type, href) =>
		windowService.handleNavigateToUrl(event, title, type, href),
	);
	ipcMain.handle("windowService:focusWindow", (event, windowId, tabId) =>
		windowService.focusWindow(event, windowId, tabId),
	);
	ipcMain.handle("windowService:handleDropAtPointer", (event, tabId, pointer) =>
		windowService.handleDropAtPointer(event, tabId, pointer),
	);
	ipcMain.handle("windowService:handleSplitShellWindow", (event, triggerTabId) =>
		windowService.handleSplitShellWindow(event, triggerTabId),
	);
	ipcMain.handle(
		"windowService:handleMoveTabIntoExistingWindow",
		(event, triggerTabId, windowId, insertIndex) =>
			windowService.handleMoveTabIntoExistingWindow(
				event,
				triggerTabId,
				windowId,
				insertIndex,
			),
	);
	ipcMain.handle("windowService:navigateToThread", (event, threadId, sourceWindowId) =>
		windowService.navigateToThread(event, threadId, sourceWindowId),
	);

	// deepLinkService service registration
	ipcMain.handle("deepLinkService:simulateDeepLink", (event, url) =>
		deepLinkService.simulateDeepLink(event, url),
	);

	// threadStateService service registration
	ipcMain.handle("threadStateService:updateBusyState", (event, data) =>
		threadStateService.updateBusyState(event, data),
	);
	ipcMain.handle("threadStateService:getBusyThreads", (event) =>
		threadStateService.getBusyThreads(event),
	);
	ipcMain.handle("threadStateService:getBusyLocalAgentThreads", (event) =>
		threadStateService.getBusyLocalAgentThreads(event),
	);

	// tabService service registration
	ipcMain.handle("tabService:handleUpdateTabType", (event, tabId, type) =>
		tabService.handleUpdateTabType(event, tabId, type),
	);
	ipcMain.handle(
		"tabService:handleNewTabWithThread",
		(event, threadId, title, type, active, initialSearchQuery, initialSearchResultIds) =>
			tabService.handleNewTabWithThread(
				event,
				threadId,
				title,
				type,
				active,
				initialSearchQuery,
				initialSearchResultIds,
			),
	);
	ipcMain.handle(
		"tabService:handleNewTab",
		(event, title, type, active, href, content, previewId) =>
			tabService.handleNewTab(event, title, type, active, href, content, previewId),
	);
	ipcMain.handle("tabService:handleActivateTab", (event, tabId) =>
		tabService.handleActivateTab(event, tabId),
	);
	ipcMain.handle("tabService:getActiveTab", (event) => tabService.getActiveTab(event));
	ipcMain.handle("tabService:getAllTabsForCurrentWindow", (event) =>
		tabService.getAllTabsForCurrentWindow(event),
	);
	ipcMain.handle("tabService:getAllTabs", (event) => tabService.getAllTabs(event));
	ipcMain.handle("tabService:handleTabClose", (event, tabId, newActiveTabId) =>
		tabService.handleTabClose(event, tabId, newActiveTabId),
	);
	ipcMain.handle("tabService:handleTabCloseOthers", (event, tabId, tabIdsToClose) =>
		tabService.handleTabCloseOthers(event, tabId, tabIdsToClose),
	);
	ipcMain.handle(
		"tabService:handleTabCloseOffside",
		(event, tabId, tabIdsToClose, _remainingTabIds, shouldSwitchActive) =>
			tabService.handleTabCloseOffside(
				event,
				tabId,
				tabIdsToClose,
				_remainingTabIds,
				shouldSwitchActive,
			),
	);
	ipcMain.handle("tabService:handleShellViewLevel", (event, up) =>
		tabService.handleShellViewLevel(event, up),
	);
	ipcMain.handle("tabService:replaceTabContent", (event, tabId, newThreadId) =>
		tabService.replaceTabContent(event, tabId, newThreadId),
	);
	ipcMain.handle("tabService:handleClearTabMessages", (event, tabId, threadId) =>
		tabService.handleClearTabMessages(event, tabId, threadId),
	);
	ipcMain.handle("tabService:handleGenerateTabTitle", (event, tabId, threadId) =>
		tabService.handleGenerateTabTitle(event, tabId, threadId),
	);
	ipcMain.handle("tabService:triggerCreateSkillSummary", (event, threadId) =>
		tabService.triggerCreateSkillSummary(event, threadId),
	);

	// aiApplicationService service registration
	ipcMain.handle("aiApplicationService:getAiApplicationUrl", (event, applicationId) =>
		aiApplicationService.getAiApplicationUrl(event, applicationId),
	);
	ipcMain.handle("aiApplicationService:handleAiApplicationReloadIpc", (event, tabId) =>
		aiApplicationService.handleAiApplicationReloadIpc(event, tabId),
	);
	ipcMain.handle("aiApplicationService:refreshAiApplications", (event) =>
		aiApplicationService.refreshAiApplications(event),
	);

	// appService service registration
	ipcMain.handle("appService:getUserAgentFragment", (event) =>
		appService.getUserAgentFragment(event),
	);
	ipcMain.handle("appService:getTheme", (event) => appService.getTheme(event));
	ipcMain.handle("appService:setTheme", (event, theme) => appService.setTheme(event, theme));
	ipcMain.handle("appService:restartApp", (event) => appService.restartApp(event));
	ipcMain.handle("appService:resetAllData", (event) => appService.resetAllData(event));
	ipcMain.handle("appService:clearChatHistory", (event) => appService.clearChatHistory(event));
	ipcMain.handle("appService:extractZipBlob", (event, zipData, originalFileName) =>
		appService.extractZipBlob(event, zipData, originalFileName),
	);
	ipcMain.handle("appService:scanDirectory", (event, dirPath) =>
		appService.scanDirectory(event, dirPath),
	);
	ipcMain.handle("appService:readFile", (event, filePath) =>
		appService.readFile(event, filePath),
	);
	ipcMain.handle("appService:readFileAsBuffer", (event, filePath) =>
		appService.readFileAsBuffer(event, filePath),
	);
	ipcMain.handle("appService:writeFile", (event, filePath, content) =>
		appService.writeFile(event, filePath, content),
	);
	ipcMain.handle("appService:createDirectory", (event, dirPath) =>
		appService.createDirectory(event, dirPath),
	);
	ipcMain.handle("appService:deleteFile", (event, filePath) =>
		appService.deleteFile(event, filePath),
	);
	ipcMain.handle("appService:deleteDirectory", (event, dirPath) =>
		appService.deleteDirectory(event, dirPath),
	);
	ipcMain.handle("appService:renameFile", (event, oldPath, newPath) =>
		appService.renameFile(event, oldPath, newPath),
	);
	ipcMain.handle("appService:zipDirectory", (event, dirPath, zipName) =>
		appService.zipDirectory(event, dirPath, zipName),
	);
	ipcMain.handle("appService:createSkillTempDir", (event, skillName) =>
		appService.createSkillTempDir(event, skillName),
	);
	ipcMain.handle("appService:deleteTempDir", (event, dirPath) =>
		appService.deleteTempDir(event, dirPath),
	);

	// cloudModeService service registration
	ipcMain.handle("cloudModeService:overrideCloudModeHealthPolling", (event, mode) =>
		cloudModeService.overrideCloudModeHealthPolling(event, mode),
	);
	ipcMain.handle("cloudModeService:syncCloudInstanceToLocalByIpc", (event) =>
		cloudModeService.syncCloudInstanceToLocalByIpc(event),
	);
	ipcMain.handle("cloudModeService:syncAndStartPollingByIpc", (event) =>
		cloudModeService.syncAndStartPollingByIpc(event),
	);
	ipcMain.handle("cloudModeService:getCloudModeInstanceBaseUrlByIpc", (event) =>
		cloudModeService.getCloudModeInstanceBaseUrlByIpc(event),
	);
	ipcMain.handle("cloudModeService:getHealthStatusByIpc", (event) =>
		cloudModeService.getHealthStatusByIpc(event),
	);
	ipcMain.handle("cloudModeService:refreshHealthByIpc", (event) =>
		cloudModeService.refreshHealthByIpc(event),
	);

	// dataService service registration
	ipcMain.handle("dataService:importLegacyJson", (event) => dataService.importLegacyJson(event));
	ipcMain.handle("dataService:exportStorage", (event) => dataService.exportStorage(event));
	ipcMain.handle("dataService:importStorage", (event) => dataService.importStorage(event));
	ipcMain.handle("dataService:listBackups", (event) => dataService.listBackups(event));
	ipcMain.handle("dataService:restoreFromBackup", (event, backupPath) =>
		dataService.restoreFromBackup(event, backupPath),
	);
	ipcMain.handle("dataService:deleteBackup", (event, backupPath) =>
		dataService.deleteBackup(event, backupPath),
	);
	ipcMain.handle("dataService:openBackupDirectory", (event) =>
		dataService.openBackupDirectory(event),
	);
	ipcMain.handle("dataService:checkOldVersionData", (event) =>
		dataService.checkOldVersionData(event),
	);
	ipcMain.handle("dataService:zipFolderForUpload", (event) =>
		dataService.zipFolderForUpload(event),
	);
	ipcMain.handle("dataService:selectFolderForUpload", (event) =>
		dataService.selectFolderForUpload(event),
	);
	ipcMain.handle(
		"dataService:exportChatToFile",
		(event, content, extension, filterName, defaultFileName) =>
			dataService.exportChatToFile(event, content, extension, filterName, defaultFileName),
	);

	// devLauncherService service registration
	ipcMain.handle("devLauncherService:launchDevSandbox", (event, imageAddress, engine) =>
		devLauncherService.launchDevSandbox(event, imageAddress, engine),
	);
	ipcMain.handle("devLauncherService:stopDevSandbox", (event) =>
		devLauncherService.stopDevSandbox(event),
	);

	// externalLinkService service registration
	ipcMain.handle("externalLinkService:openExternalLink", (event, url) =>
		externalLinkService.openExternalLink(event, url),
	);
	ipcMain.handle("externalLinkService:open302WebsiteLink", (event, path) =>
		externalLinkService.open302WebsiteLink(event, path),
	);

	// loggerService service registration
	ipcMain.handle("loggerService:log", (event, level, category, processType, message, args) =>
		loggerService.log(event, level, category, processType, message, args),
	);
	ipcMain.handle("loggerService:exportLogs", (event, startDate, startHour, endDate, endHour) =>
		loggerService.exportLogs(event, startDate, startHour, endDate, endHour),
	);

	// mcpService service registration
	ipcMain.handle("mcpService:getToolsFromServer", (event, server) =>
		mcpService.getToolsFromServer(event, server),
	);
	ipcMain.handle("mcpService:closeServer", (event, serverId) =>
		mcpService.closeServer(event, serverId),
	);

	// notificationService service registration
	ipcMain.handle("notificationService:notifyTaskCompleted", (event, options) =>
		notificationService.notifyTaskCompleted(event, options),
	);
	ipcMain.handle("notificationService:requestPermission", (event) =>
		notificationService.requestPermission(event),
	);

	// openClawService service registration
	ipcMain.handle("openClawService:getOpenClawWebUiUrl", (event) =>
		openClawService.getOpenClawWebUiUrl(event),
	);
	ipcMain.handle("openClawService:applyOpenClawChannelConfig", (event) =>
		openClawService.applyOpenClawChannelConfig(event),
	);
	ipcMain.handle("openClawService:applyCloudClawChannelConfig", (event) =>
		openClawService.applyCloudClawChannelConfig(event),
	);
	ipcMain.handle("openClawService:applyOpenClawBindingsConfig", (event, threadId) =>
		openClawService.applyOpenClawBindingsConfig(event, threadId),
	);
	ipcMain.handle("openClawService:applyCloudClawBindingsConfig", (event, threadId) =>
		openClawService.applyCloudClawBindingsConfig(event, threadId),
	);
	ipcMain.handle("openClawService:restartCloudOpenClaw", (event, instanceName) =>
		openClawService.restartCloudOpenClaw(event, instanceName),
	);
	ipcMain.handle("openClawService:handleOpenClawWebUiReloadIpc", (event, tabId) =>
		openClawService.handleOpenClawWebUiReloadIpc(event, tabId),
	);
	ipcMain.handle("openClawService:wechatInsalled", (event) =>
		openClawService.wechatInsalled(event),
	);
	ipcMain.handle("openClawService:connectWechat", (event) =>
		openClawService.connectWechat(event),
	);
	ipcMain.handle("openClawService:installWechat", (event) =>
		openClawService.installWechat(event),
	);
	ipcMain.handle("openClawService:disposeWechat", (event) =>
		openClawService.disposeWechat(event),
	);

	// providerService service registration
	ipcMain.handle("providerService:handle302AIProviderChange", (event, apiKey) =>
		providerService.handle302AIProviderChange(event, apiKey),
	);
	ipcMain.handle("providerService:get302AIApiKey", (event) =>
		providerService.get302AIApiKey(event),
	);
	ipcMain.handle("providerService:get302AIBaseUrl", (event) =>
		providerService.get302AIBaseUrl(event),
	);
	ipcMain.handle("providerService:get302AIBaseUrlWithoutV1", (event) =>
		providerService.get302AIBaseUrlWithoutV1(event),
	);
	ipcMain.handle("providerService:get302WebsiteBaseDomain", (event) =>
		providerService.get302WebsiteBaseDomain(event),
	);
	ipcMain.handle("providerService:get302WebsiteUrl", (event, path) =>
		providerService.get302WebsiteUrl(event, path),
	);

	// threadService service registration
	ipcMain.handle("threadService:addThread", (event, threadId) =>
		threadService.addThread(event, threadId),
	);
	ipcMain.handle("threadService:getThreads", (event) => threadService.getThreads(event));
	ipcMain.handle("threadService:getThread", (event, threadId) =>
		threadService.getThread(event, threadId),
	);
	ipcMain.handle("threadService:deleteThread", (event, threadId) =>
		threadService.deleteThread(event, threadId),
	);
	ipcMain.handle("threadService:renameThread", (event, threadId, newName) =>
		threadService.renameThread(event, threadId, newName),
	);
	ipcMain.handle("threadService:addFavorite", (event, threadId) =>
		threadService.addFavorite(event, threadId),
	);
	ipcMain.handle("threadService:removeFavorite", (event, threadId) =>
		threadService.removeFavorite(event, threadId),
	);
	ipcMain.handle("threadService:deleteThreadsByApiKeyHash", (event, apiKeyHash) =>
		threadService.deleteThreadsByApiKeyHash(event, apiKeyHash),
	);
	ipcMain.handle("threadService:clearDeletedModelReferences", (event, deletedModelIds) =>
		threadService.clearDeletedModelReferences(event, deletedModelIds),
	);

	// updaterService service registration
	ipcMain.handle("updaterService:checkForUpdatesManually", (event) =>
		updaterService.checkForUpdatesManually(event),
	);
	ipcMain.handle("updaterService:quitAndInstall", (event) =>
		updaterService.quitAndInstall(event),
	);
	ipcMain.handle("updaterService:isUpdateDownloaded", (event) =>
		updaterService.isUpdateDownloaded(event),
	);
	ipcMain.handle("updaterService:setAutoUpdate", (event, enabled) =>
		updaterService.setAutoUpdate(event, enabled),
	);
	ipcMain.handle("updaterService:setUpdateChannel", (event, channel) =>
		updaterService.setUpdateChannel(event, channel),
	);
	ipcMain.handle("updaterService:getUpdateChannel", (event) =>
		updaterService.getUpdateChannel(event),
	);
}

/**
 * Clean up IPC handlers
 */
export function removeIpcHandlers() {
	ipcMain.removeHandler("broadcastService:broadcastExcludeSource");
	ipcMain.removeHandler("broadcastService:broadcastToAll");
	ipcMain.removeHandler("storageService:setItem");
	ipcMain.removeHandler("storageService:getItem");
	ipcMain.removeHandler("storageService:hasItem");
	ipcMain.removeHandler("storageService:removeItem");
	ipcMain.removeHandler("storageService:getKeys");
	ipcMain.removeHandler("storageService:clear");
	ipcMain.removeHandler("storageService:getMeta");
	ipcMain.removeHandler("storageService:setMeta");
	ipcMain.removeHandler("storageService:removeMeta");
	ipcMain.removeHandler("storageService:getItems");
	ipcMain.removeHandler("storageService:setItems");
	ipcMain.removeHandler("storageService:watch");
	ipcMain.removeHandler("storageService:unwatch");
	ipcMain.removeHandler("generalSettingsService:handleLanguageChanged");
	ipcMain.removeHandler("generalSettingsService:handleProxyChanged");
	ipcMain.removeHandler("generalSettingsService:testProxyConnection");
	ipcMain.removeHandler("generalSettingsService:getCacheDirectory");
	ipcMain.removeHandler("generalSettingsService:setCacheDirectory");
	ipcMain.removeHandler("generalSettingsService:getCacheInfo");
	ipcMain.removeHandler("generalSettingsService:clearCache");
	ipcMain.removeHandler("generalSettingsService:resetCacheToDefault");
	ipcMain.removeHandler("generalSettingsService:selectCacheDirectory");
	ipcMain.removeHandler("ssoService:openSsoLogin");
	ipcMain.removeHandler("ssoService:waitForSsoCallback");
	ipcMain.removeHandler("ssoService:cancelSsoLogin");
	ipcMain.removeHandler("ghostWindowService:startTracking");
	ipcMain.removeHandler("ghostWindowService:stopTracking");
	ipcMain.removeHandler("ghostWindowService:updateInsertIndex");
	ipcMain.removeHandler("shortcutService:init");
	ipcMain.removeHandler("shortcutService:updateShortcuts");
	ipcMain.removeHandler("shortcutService:getConflicts");
	ipcMain.removeHandler("shortcutService:getSyncInfo");
	ipcMain.removeHandler("localVibeService:copyToWorkspaceByIpc");
	ipcMain.removeHandler("localVibeService:getComposeDirectory");
	ipcMain.removeHandler("localVibeService:openComposeDirectory");
	ipcMain.removeHandler("localVibeService:openWorkspaceDirectory");
	ipcMain.removeHandler("localVibeService:getLocalBaseUrl");
	ipcMain.removeHandler("localVibeService:getSandboxStatus");
	ipcMain.removeHandler("localVibeService:triggerSystemRestart");
	ipcMain.removeHandler("localVibeService:validPodman");
	ipcMain.removeHandler("localVibeService:startPodmanHealthCheck");
	ipcMain.removeHandler("localVibeService:installWSL");
	ipcMain.removeHandler("localVibeService:installScoop");
	ipcMain.removeHandler("localVibeService:installHomebrew");
	ipcMain.removeHandler("localVibeService:installPodman");
	ipcMain.removeHandler("localVibeService:initPodmanMachine");
	ipcMain.removeHandler("localVibeService:stopLocalSandboxByIpc");
	ipcMain.removeHandler("localVibeService:ensureLocalSandboxRunning");
	ipcMain.removeHandler("localVibeService:startPodmanMachine");
	ipcMain.removeHandler("localVibeService:restartPodmanMachine");
	ipcMain.removeHandler("localVibeService:updateOpenclawModels");
	ipcMain.removeHandler("codeAgentService:updateClaudeCodeSandboxModel");
	ipcMain.removeHandler("codeAgentService:checkClaudeCodeSandbox");
	ipcMain.removeHandler("codeAgentService:updateClaudeCodeSandboxesByIpc");
	ipcMain.removeHandler("codeAgentService:updateClaudeCodeSessions");
	ipcMain.removeHandler("codeAgentService:updateClaudeCodeCurrentSessionIdByThreadId");
	ipcMain.removeHandler("codeAgentService:updateClaudeCodeSandboxRemark");
	ipcMain.removeHandler("codeAgentService:updateClaudeCodeSandboxThinkingBudget");
	ipcMain.removeHandler("codeAgentService:createClaudeCodeSandboxByIpc");
	ipcMain.removeHandler("codeAgentService:deleteClaudeCodeSandboxByIpc");
	ipcMain.removeHandler("codeAgentService:deleteClaudeCodeSession");
	ipcMain.removeHandler("codeAgentService:findClaudeCodeSandboxWithValidDisk");
	ipcMain.removeHandler("codeAgentService:addClaudeCodeSandboxMCP");
	ipcMain.removeHandler("codeAgentService:createThreadForSession");
	ipcMain.removeHandler("codeAgentService:getThreadIdBySessionId");
	ipcMain.removeHandler("codeAgentService:setIsManualNoteBySession");
	ipcMain.removeHandler("codeAgentService:deleteWorkspaceDirectory");
	ipcMain.removeHandler("codeAgentService:renameWorkspaceDirectory");
	ipcMain.removeHandler("windowService:handleOpenSettingsWindow");
	ipcMain.removeHandler("windowService:handleNavigateToUrl");
	ipcMain.removeHandler("windowService:focusWindow");
	ipcMain.removeHandler("windowService:handleDropAtPointer");
	ipcMain.removeHandler("windowService:handleSplitShellWindow");
	ipcMain.removeHandler("windowService:handleMoveTabIntoExistingWindow");
	ipcMain.removeHandler("windowService:navigateToThread");
	ipcMain.removeHandler("deepLinkService:simulateDeepLink");
	ipcMain.removeHandler("threadStateService:updateBusyState");
	ipcMain.removeHandler("threadStateService:getBusyThreads");
	ipcMain.removeHandler("threadStateService:getBusyLocalAgentThreads");
	ipcMain.removeHandler("tabService:handleUpdateTabType");
	ipcMain.removeHandler("tabService:handleNewTabWithThread");
	ipcMain.removeHandler("tabService:handleNewTab");
	ipcMain.removeHandler("tabService:handleActivateTab");
	ipcMain.removeHandler("tabService:getActiveTab");
	ipcMain.removeHandler("tabService:getAllTabsForCurrentWindow");
	ipcMain.removeHandler("tabService:getAllTabs");
	ipcMain.removeHandler("tabService:handleTabClose");
	ipcMain.removeHandler("tabService:handleTabCloseOthers");
	ipcMain.removeHandler("tabService:handleTabCloseOffside");
	ipcMain.removeHandler("tabService:handleShellViewLevel");
	ipcMain.removeHandler("tabService:replaceTabContent");
	ipcMain.removeHandler("tabService:handleClearTabMessages");
	ipcMain.removeHandler("tabService:handleGenerateTabTitle");
	ipcMain.removeHandler("tabService:triggerCreateSkillSummary");
	ipcMain.removeHandler("aiApplicationService:getAiApplicationUrl");
	ipcMain.removeHandler("aiApplicationService:handleAiApplicationReloadIpc");
	ipcMain.removeHandler("aiApplicationService:refreshAiApplications");
	ipcMain.removeHandler("appService:getUserAgentFragment");
	ipcMain.removeHandler("appService:getTheme");
	ipcMain.removeHandler("appService:setTheme");
	ipcMain.removeHandler("appService:restartApp");
	ipcMain.removeHandler("appService:resetAllData");
	ipcMain.removeHandler("appService:clearChatHistory");
	ipcMain.removeHandler("appService:extractZipBlob");
	ipcMain.removeHandler("appService:scanDirectory");
	ipcMain.removeHandler("appService:readFile");
	ipcMain.removeHandler("appService:readFileAsBuffer");
	ipcMain.removeHandler("appService:writeFile");
	ipcMain.removeHandler("appService:createDirectory");
	ipcMain.removeHandler("appService:deleteFile");
	ipcMain.removeHandler("appService:deleteDirectory");
	ipcMain.removeHandler("appService:renameFile");
	ipcMain.removeHandler("appService:zipDirectory");
	ipcMain.removeHandler("appService:createSkillTempDir");
	ipcMain.removeHandler("appService:deleteTempDir");
	ipcMain.removeHandler("cloudModeService:overrideCloudModeHealthPolling");
	ipcMain.removeHandler("cloudModeService:syncCloudInstanceToLocalByIpc");
	ipcMain.removeHandler("cloudModeService:syncAndStartPollingByIpc");
	ipcMain.removeHandler("cloudModeService:getCloudModeInstanceBaseUrlByIpc");
	ipcMain.removeHandler("cloudModeService:getHealthStatusByIpc");
	ipcMain.removeHandler("cloudModeService:refreshHealthByIpc");
	ipcMain.removeHandler("dataService:importLegacyJson");
	ipcMain.removeHandler("dataService:exportStorage");
	ipcMain.removeHandler("dataService:importStorage");
	ipcMain.removeHandler("dataService:listBackups");
	ipcMain.removeHandler("dataService:restoreFromBackup");
	ipcMain.removeHandler("dataService:deleteBackup");
	ipcMain.removeHandler("dataService:openBackupDirectory");
	ipcMain.removeHandler("dataService:checkOldVersionData");
	ipcMain.removeHandler("dataService:zipFolderForUpload");
	ipcMain.removeHandler("dataService:selectFolderForUpload");
	ipcMain.removeHandler("dataService:exportChatToFile");
	ipcMain.removeHandler("devLauncherService:launchDevSandbox");
	ipcMain.removeHandler("devLauncherService:stopDevSandbox");
	ipcMain.removeHandler("externalLinkService:openExternalLink");
	ipcMain.removeHandler("externalLinkService:open302WebsiteLink");
	ipcMain.removeHandler("loggerService:log");
	ipcMain.removeHandler("loggerService:exportLogs");
	ipcMain.removeHandler("mcpService:getToolsFromServer");
	ipcMain.removeHandler("mcpService:closeServer");
	ipcMain.removeHandler("notificationService:notifyTaskCompleted");
	ipcMain.removeHandler("notificationService:requestPermission");
	ipcMain.removeHandler("openClawService:getOpenClawWebUiUrl");
	ipcMain.removeHandler("openClawService:applyOpenClawChannelConfig");
	ipcMain.removeHandler("openClawService:applyCloudClawChannelConfig");
	ipcMain.removeHandler("openClawService:applyOpenClawBindingsConfig");
	ipcMain.removeHandler("openClawService:applyCloudClawBindingsConfig");
	ipcMain.removeHandler("openClawService:restartCloudOpenClaw");
	ipcMain.removeHandler("openClawService:handleOpenClawWebUiReloadIpc");
	ipcMain.removeHandler("openClawService:wechatInsalled");
	ipcMain.removeHandler("openClawService:connectWechat");
	ipcMain.removeHandler("openClawService:installWechat");
	ipcMain.removeHandler("openClawService:disposeWechat");
	ipcMain.removeHandler("providerService:handle302AIProviderChange");
	ipcMain.removeHandler("providerService:get302AIApiKey");
	ipcMain.removeHandler("providerService:get302AIBaseUrl");
	ipcMain.removeHandler("providerService:get302AIBaseUrlWithoutV1");
	ipcMain.removeHandler("providerService:get302WebsiteBaseDomain");
	ipcMain.removeHandler("providerService:get302WebsiteUrl");
	ipcMain.removeHandler("threadService:addThread");
	ipcMain.removeHandler("threadService:getThreads");
	ipcMain.removeHandler("threadService:getThread");
	ipcMain.removeHandler("threadService:deleteThread");
	ipcMain.removeHandler("threadService:renameThread");
	ipcMain.removeHandler("threadService:addFavorite");
	ipcMain.removeHandler("threadService:removeFavorite");
	ipcMain.removeHandler("threadService:deleteThreadsByApiKeyHash");
	ipcMain.removeHandler("threadService:clearDeletedModelReferences");
	ipcMain.removeHandler("updaterService:checkForUpdatesManually");
	ipcMain.removeHandler("updaterService:quitAndInstall");
	ipcMain.removeHandler("updaterService:isUpdateDownloaded");
	ipcMain.removeHandler("updaterService:setAutoUpdate");
	ipcMain.removeHandler("updaterService:setUpdateChannel");
	ipcMain.removeHandler("updaterService:getUpdateChannel");
}

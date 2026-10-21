import { initMainProcessLogger } from "@shared/logger";
import { AiApplicationService, aiApplicationService } from "./ai-application-service";
import { AppService, appService } from "./app-service";
import { AttachmentsService, attachmentsService } from "./attachments-sevice";
import { BroadcastService, broadcastService } from "./broadcast-service";
import { CloudModeService, cloudModeService } from "./cloud-mode-sevice";
import { CodeAgentService, codeAgentService } from "./code-agent-service";
import { DataService, dataService } from "./data-service";
import { DeepLinkService, deepLinkService } from "./deep-link-service";
import { DevLauncherService, devLauncherService } from "./dev-launcher-service";
import { ExternalLinkService, externalLinkService } from "./external-link-service";
import { GhostWindowService, ghostWindowService } from "./ghost-window-service";
import { localVibeService, LocalVibeService } from "./local-vibe-service";
import { LoggerService, loggerService } from "./logger-service";
import { McpService, mcpService } from "./mcp-service";
import { NotificationService, notificationService } from "./notification-service";
import { OpenClawService, openClawService } from "./openclaw-service";
import { providerService, ProviderService } from "./provider-service";
import { SchedulerService, schedulerService } from "./scheduler-service";
import { GeneralSettingsService, generalSettingsService } from "./settings-service";
import { ShortcutService, shortcutService } from "./shortcut-service";
import { SsoService, ssoService } from "./sso-service";
import { StorageService, storageService } from "./storage-service";
import { TabService, tabService } from "./tab-service";
import { ThreadService, threadService } from "./thread-service";
import { ThreadStateService, threadStateService } from "./thread-state-service";
import { TrayService, trayService } from "./tray-service";
import { UpdaterService, updaterService } from "./updater-service";
import { WindowService, windowService } from "./window-service";

// Wire up the shared logger factory so main-process code that calls
// createLogger() routes through the real LoggerService.
initMainProcessLogger((level, category, message, ...args) => {
	loggerService.logMain(level, category, message, ...args);
});

// Export service classes for type definitions
export {
	AiApplicationService,
	AppService,
	AttachmentsService,
	BroadcastService,
	CloudModeService,
	CodeAgentService,
	DataService,
	DeepLinkService,
	DevLauncherService,
	ExternalLinkService,
	GeneralSettingsService,
	GhostWindowService,
	LocalVibeService,
	LoggerService,
	McpService,
	NotificationService,
	OpenClawService,
	ProviderService,
	SchedulerService,
	ShortcutService,
	SsoService,
	StorageService,
	TabService,
	ThreadService,
	ThreadStateService,
	TrayService,
	UpdaterService,
	WindowService,
};

// Export service instances for use in IPC registration
export {
	aiApplicationService,
	appService,
	attachmentsService,
	broadcastService,
	cloudModeService,
	codeAgentService,
	dataService,
	deepLinkService,
	devLauncherService,
	externalLinkService,
	generalSettingsService,
	ghostWindowService,
	localVibeService,
	loggerService,
	mcpService,
	notificationService,
	openClawService,
	providerService,
	schedulerService,
	shortcutService,
	ssoService,
	storageService,
	tabService,
	threadService,
	threadStateService,
	trayService,
	updaterService,
	windowService,
};

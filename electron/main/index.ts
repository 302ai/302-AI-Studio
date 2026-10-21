/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
import fixPath from "fix-path";
fixPath();

import { DEFAULT_SHORTCUTS } from "@shared/config/default-shortcuts";
import { createLogger } from "@shared/logger";
import type { ShortcutBinding, ShortcutScope } from "@shared/types/shortcut";
import { app, net, protocol } from "electron";
import started from "electron-squirrel-startup";
import path from "node:path";
import { isMac } from "./constants";
import { WebContentsFactory } from "./factories/web-contents-factory";
import { registerIpcHandlers } from "./generated/ipc-registration";
import { initServer } from "./server/router";
import {
	appService,
	deepLinkService,
	localVibeService,
	shortcutService,
	trayService,
	windowService,
} from "./services";
import { proxyForwardService } from "./services/proxy-forward-service";
import { StorageService } from "./services/storage-service";
import { UpdaterService } from "./services/updater-service";
import { setupNetworkInterceptor } from "./utils/network-interceptor";

const logger = createLogger("main");

protocol.registerSchemesAsPrivileged([
	{ scheme: "app", privileges: { standard: true, secure: true } },
]);

// Initialize deep link protocol handler before app is ready
deepLinkService.initializeProtocolHandler();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

// Implement single instance lock to prevent multiple app instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
	// Another instance is already running, quit this instance
	app.quit();
} else {
	// This instance got the lock, listen for second instance attempts
	app.on("second-instance", (_event, commandLine) => {
		logger.info("[Main] second-instance event");

		// Delegate deep link handling to service if present in commandLine
		const deepLinkUrl = commandLine.find((arg) => arg.startsWith("ai302studio://"));
		if (deepLinkUrl) {
			deepLinkService.handleDeepLink(deepLinkUrl);
		}

		// When a second instance tries to start, focus the main window
		const mainWindow = windowService.getMainWindow();
		if (!mainWindow) return;
		if (mainWindow.isMinimized()) mainWindow.restore();
		if (!mainWindow.isVisible()) mainWindow.show();
		mainWindow.focus();
	});

	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	app.on("ready", async () => {
		await init();

		// Start proxy forward service
		try {
			await proxyForwardService.start();
			logger.info("[Main] Proxy forward service started successfully");
		} catch (error) {
			logger.error("[Main] Failed to start proxy forward service:", error);
			// Continue app initialization even if proxy service fails
		}

		// Apply saved proxy settings on startup
		try {
			const { generalSettingsStorage } = await import(
				"./services/storage-service/general-settings-storage"
			);
			const { generalSettingsService } = await import(
				"./services/settings-service/general-settings-service"
			);
			const proxySettings = await generalSettingsStorage.getProxySettings();
			if (proxySettings.enabled) {
				await generalSettingsService.applyProxySettings(proxySettings);
				logger.info("Proxy settings applied on startup:", proxySettings);
			}
		} catch (error) {
			logger.error("Failed to apply proxy settings on startup:", error);
		}

		// Configure Custom Headers and User Agent
		setupNetworkInterceptor();

		const serverPort = await initServer();
		logger.debug(`Server initialized on port ${serverPort}`);
		WebContentsFactory.setServerPort(serverPort);

		// Initialize system tray
		await trayService.init();

		await windowService.initShellWindows();
	});

	// Quit when all windows are closed, except on macOS. There, it's common
	// for applications and their menu bar to stay active until the user quits
	// explicitly with Cmd + Q.
	app.on("window-all-closed", async () => {
		if (!isMac) {
			// Skip if we are currently installing an update, as updater service handles its own stop logic
			if (UpdaterService.isInstallingUpdateNow()) {
				logger.info(
					"[Main] Update installation in progress, skipping window-all-closed handler",
				);
				return;
			}

			// Stop proxy forward service
			try {
				await proxyForwardService.stop();
				logger.info("[Main] Proxy forward service stopped");
			} catch (error) {
				logger.error("[Main] Failed to stop proxy forward service:", error);
			}

			// Stop local sandbox before quitting (for Windows/Linux)
			logger.info("[Main] All windows closed, stopping local sandbox...");
			if (app.isPackaged) {
				// The program is running in the production environment.
				await localVibeService.stopLocalSandbox();
			}
			logger.info("[Main] Local sandbox stopped, quitting app...");
			app.quit();
		}
	});

	// macOS specific handling for Cmd+Q to ensure proper cleanup
	if (isMac) {
		// Handle Cmd+Q (or menu quit) - ensure window close listeners fire
		app.on("before-quit", async (event) => {
			if (UpdaterService.isInstallingUpdateNow()) return;

			event.preventDefault();
			// Enable force quitting mode to bypass macOS hide behavior
			windowService.setCMDQ(true);

			// Close windows in reverse order so main window closes last
			const windows = windowService.getOrderedWindows().reverse();
			windows.forEach((window) => {
				window.close();
			});

			// Stop proxy forward service
			try {
				await proxyForwardService.stop();
				logger.info("[Main] Proxy forward service stopped");
			} catch (error) {
				logger.error("[Main] Failed to stop proxy forward service:", error);
			}

			// Stop local sandbox before exiting (for macOS)
			logger.info("[Main] Stopping local sandbox before exit...");
			const result = await localVibeService.stopLocalSandbox();
			logger.info("[Main] Local sandbox stop result:", result);

			app.exit();
		});
	}

	app.on("activate", () => {
		// Check if windows are currently being initialized
		if (windowService.isInitializingWindows()) {
			logger.info("[Main] Windows are initializing, skipping activate handler");
			return;
		}

		// Check if any windows exist (not just main window)
		if (windowService.hasAnyWindows()) {
			const mainWindow = windowService.getMainWindow();
			if (mainWindow) {
				mainWindow.show();
			}
		} else {
			// Only initialize if no windows exist
			windowService.initShellWindows();
		}
	});
}

async function init() {
	// Register auto-generated IPC handlers
	registerIpcHandlers();

	// Run storage migrations FIRST to ensure data integrity
	await StorageService.runAllMigrations();

	await appService.initFromStorage();

	// Initialize cache manager
	try {
		const { cacheManager } = await import("./services/cache-manager");
		await cacheManager.initialize();
		logger.info("[Main] Cache manager initialized successfully");
	} catch (error) {
		logger.error("[Main] Failed to initialize cache manager:", error);
		// Continue app initialization even if cache manager fails
	}

	// Pre-load shortcut actions handler to avoid first-run latency
	const { shortcutActionsHandler } = await import("./services/shortcut-service/actions-handler");

	// Initialize shortcut system
	const defaultShortcuts: ShortcutBinding[] = DEFAULT_SHORTCUTS.map((s) => ({
		id: s.id,
		action: s.action,
		keys: Array.from(s.keys),
		scope: s.scope as ShortcutScope,
		order: s.order,
		requiresNonEditable: true,
	}));
	shortcutService.getEngine().init(defaultShortcuts, async (action, ctx) => {
		await shortcutActionsHandler.handle(action, ctx);
	});

	const root = path.join(import.meta.dirname, `../../renderer/${MAIN_WINDOW_VITE_NAME}`);
	protocol.handle("app", (request) => {
		const url = new URL(request.url);
		let pathname = decodeURIComponent(url.pathname);
		const appIndex = pathname.indexOf("/_app/");
		if (appIndex !== -1) {
			pathname = pathname.slice(appIndex);
		}

		const filePath = pathname.startsWith("/") ? pathname.slice(1) : pathname;

		const isAsset = /\.[a-z0-9]+$/i.test(filePath) || filePath.startsWith("_app/");
		const target = isAsset ? path.join(root, filePath) : path.join(root, "index.html");

		const normalized = path.normalize(target);
		if (!normalized.startsWith(path.normalize(root))) {
			return net.fetch(`file://${path.join(root, "index.html")}`);
		}

		return net.fetch(`file://${normalized}`);
	});
}

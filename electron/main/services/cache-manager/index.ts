/**
 * Cache Manager Service
 *
 * Centralized management for all application cache directories.
 *
 * SAFETY DESIGN: The user-selected directory (base) is NEVER used directly as
 * the cache root. Instead, a fixed subdirectory `<base>/302-ai-studio/` is
 * created and used. This guarantees we can only ever delete our own subtree,
 * never the user's parent directory (e.g. their home folder).
 */

import { createLogger } from "@shared/logger";
import type { CacheInfo } from "@shared/storage/general-settings";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { generalSettingsStorage } from "../storage-service/general-settings-storage";

const logger = createLogger("services");

/**
 * Fixed subdirectory name appended to whatever the user (or default tmpdir)
 * selects. This is the REAL cache root.
 */
const CACHE_ROOT_SUBDIR = "302-ai-studio";

/**
 * Cache subdirectories living under the cache root.
 */
const CACHE_SUBDIRS = {
	TEMP: "temp",
} as const;

export class CacheManager {
	private currentCacheRoot: string | null = null;
	private initialized = false;

	// ********************************************************************************* //
	// Path helpers
	// ********************************************************************************* //

	/**
	 * Default base directory (the system temp dir). The cache root is
	 * `<defaultBase>/302-ai-studio`.
	 */
	private getDefaultBase(): string {
		return os.tmpdir();
	}

	/**
	 * Resolve the real cache root from a user-selected base directory.
	 * ALWAYS nests under the fixed subdir for safety.
	 */
	private resolveCacheRoot(baseDir: string): string {
		return path.join(baseDir, CACHE_ROOT_SUBDIR);
	}

	/**
	 * Get current cache root directory.
	 */
	getCacheRoot(): string {
		if (!this.initialized || !this.currentCacheRoot) {
			return this.resolveCacheRoot(this.getDefaultBase());
		}
		return this.currentCacheRoot;
	}

	getTempCacheDir(): string {
		return path.join(this.getCacheRoot(), CACHE_SUBDIRS.TEMP);
	}

	/**
	 * Ensure all cache subdirectories exist under the current cache root.
	 */
	private async ensureCacheDirectories(): Promise<void> {
		const dirs = [this.getTempCacheDir()];
		for (const dir of dirs) {
			await fs.ensureDir(dir);
		}
	}

	// ********************************************************************************* //
	// Validation
	// ********************************************************************************* //

	/**
	 * Validate that a user-selected base directory is safe to use.
	 * Blocks system-critical and user-home directories as defense in depth
	 * (even though we always nest under a subdir).
	 */
	private async isValidCacheBase(baseDir: string): Promise<boolean> {
		try {
			const resolved = path.resolve(baseDir);

			// Defense-in-depth: block obviously dangerous locations.
			const home = path.resolve(os.homedir());
			const dangerous: string[] = [
				path.sep, // filesystem root "/"
				home, // user home (exact)
				"/etc",
				"/usr",
				"/var",
				"/bin",
				"/sbin",
				"/lib",
				"/lib64",
				"/proc",
				"/sys",
				"/dev",
				"/run",
				"/boot",
				"/system",
				"/windows",
				"C:\\",
				"C:\\Windows",
				"C:\\Program Files",
				"C:\\Users",
			];
			for (const d of dangerous) {
				if (resolved.toLowerCase() === d.toLowerCase()) {
					logger.warn(`[CacheManager] Rejected dangerous base dir: ${resolved}`);
					return false;
				}
			}

			// Ensure it exists / can be created and is writable.
			await fs.ensureDir(resolved);
			const testFile = path.join(resolved, `.cache-write-test-${Date.now()}`);
			await fs.writeFile(testFile, "ok");
			await fs.remove(testFile);
			return true;
		} catch (error) {
			logger.error(`[CacheManager] Invalid cache base ${baseDir}:`, error);
			return false;
		}
	}

	// ********************************************************************************* //
	// Initialization
	// ********************************************************************************* //

	async initialize(): Promise<void> {
		if (this.initialized) return;

		try {
			const settings = await generalSettingsStorage.getItemInternal("state");
			const customBase = settings?.cacheDirectory;

			if (customBase && (await this.isValidCacheBase(customBase))) {
				this.currentCacheRoot = this.resolveCacheRoot(customBase);
				logger.info(`[CacheManager] Cache root: ${this.currentCacheRoot}`);
				// Recover stray files written by the old buggy version that used the
				// base dir directly. Moves them into the nested cache root.
				await this.recoverStrayFiles(customBase);
			} else {
				this.currentCacheRoot = this.resolveCacheRoot(this.getDefaultBase());
				logger.info(`[CacheManager] Cache root (default): ${this.currentCacheRoot}`);

				// The stored base is invalid (e.g. user home from the old bug).
				// Clean up any stray cache dirs we may have written there, then
				// clear the broken setting so it doesn't haunt us.
				if (customBase) {
					logger.info(
						`[CacheManager] Stored base '${customBase}' is invalid, cleaning up stray files`,
					);
					await this.cleanupStrayFiles(customBase);
					await this.clearStoredCacheDirectory();
				}
			}

			await this.ensureCacheDirectories();
			this.initialized = true;
		} catch (error) {
			logger.error("[CacheManager] Failed to initialize:", error);
			this.currentCacheRoot = this.resolveCacheRoot(this.getDefaultBase());
			await this.ensureCacheDirectories();
			this.initialized = true;
		}
	}

	/**
	 * Recover cache files that the old (buggy) version may have written directly
	 * into the user-selected base directory instead of under the nested subdir.
	 *
	 * Moves `<base>/temp` into `<base>/302-ai-studio/`. Never touches anything else
	 * in the base dir, so the user's own files are always safe.
	 */
	private async recoverStrayFiles(baseDir: string): Promise<void> {
		const cacheRoot = this.resolveCacheRoot(baseDir);

		for (const subdir of Object.values(CACHE_SUBDIRS)) {
			const stray = path.join(baseDir, subdir);
			const proper = path.join(cacheRoot, subdir);

			try {
				if (!(await fs.pathExists(stray))) continue;
				// Already migrated target exists -> skip to avoid clobbering.
				if (await fs.pathExists(proper)) {
					logger.info(
						`[CacheManager] Stray '${subdir}' exists but target already present, skipping`,
					);
					continue;
				}
				await fs.ensureDir(cacheRoot);
				await fs.move(stray, proper);
				logger.info(`[CacheManager] Recovered stray '${subdir}' -> ${proper}`);
			} catch (error) {
				// Non-fatal: best-effort recovery.
				logger.warn(`[CacheManager] Could not recover stray '${subdir}':`, error);
			}
		}
	}

	/**
	 * Remove cache subdirs that the old buggy version may have written directly
	 * into a base directory that is no longer valid (e.g. the user's home).
	 * Only removes directories whose names exactly match our known subdirs.
	 */
	private async cleanupStrayFiles(baseDir: string): Promise<void> {
		for (const subdir of Object.values(CACHE_SUBDIRS)) {
			const stray = path.join(baseDir, subdir);
			try {
				if (!(await fs.pathExists(stray))) continue;
				await fs.remove(stray);
				logger.info(`[CacheManager] Cleaned up stray '${stray}'`);
			} catch (error) {
				logger.warn(`[CacheManager] Could not clean up stray '${stray}':`, error);
			}
		}
	}

	/**
	 * Clear the persisted cacheDirectory setting so the app uses the default
	 * on next launch.
	 */
	private async clearStoredCacheDirectory(): Promise<void> {
		try {
			const currentSettings = await generalSettingsStorage.getItemInternal("state");
			if (currentSettings) {
				await generalSettingsStorage.setItemInternal("state", {
					...currentSettings,
					cacheDirectory: undefined,
				});
			}
		} catch (error) {
			logger.warn("[CacheManager] Could not clear stored cacheDirectory:", error);
		}
	}

	// ********************************************************************************* //
	// Setting / migrating the cache directory
	// ********************************************************************************* //

	/**
	 * Set a new cache base directory (user-selected) and migrate existing
	 * cache content into `<newBase>/302-ai-studio/`.
	 *
	 * Safety guarantees:
	 *  - `newBase` is never deleted; only our nested subdir is.
	 *  - The old cache root (always `<oldBase>/302-ai-studio`) is the only
	 *    thing removed after a successful copy+verify.
	 */
	async setCacheDirectory(newBase: string): Promise<void> {
		logger.info(`[CacheManager] setCacheDirectory base=${newBase}`);

		if (!(await this.isValidCacheBase(newBase))) {
			throw new Error(`Invalid cache directory: ${newBase}`);
		}

		const newCacheRoot = this.resolveCacheRoot(newBase);
		const oldCacheRoot = this.getCacheRoot();

		if (path.normalize(oldCacheRoot) === path.normalize(newCacheRoot)) {
			logger.info("[CacheManager] New cache root equals current, skipping migration");
			return;
		}

		try {
			await this.migrateCacheFiles(oldCacheRoot, newCacheRoot);
			this.currentCacheRoot = newCacheRoot;

			// Persist the user-selected base.
			const currentSettings = await generalSettingsStorage.getItemInternal("state");
			if (currentSettings) {
				await generalSettingsStorage.setItemInternal("state", {
					...currentSettings,
					cacheDirectory: newBase,
				});
			}

			logger.info(`[CacheManager] Cache directory updated to: ${newCacheRoot}`);
		} catch (error) {
			logger.error("[CacheManager] Failed to migrate cache:", error);
			throw error;
		}
	}

	/**
	 * Copy the three known cache subdirs from the old cache root to the new one,
	 * then remove the OLD CACHE ROOT (which is always safe because it's our own
	 * nested `302-ai-studio` directory).
	 */
	private async migrateCacheFiles(oldCacheRoot: string, newCacheRoot: string): Promise<void> {
		logger.info(`[CacheManager] Migrating ${oldCacheRoot} -> ${newCacheRoot}`);

		const oldExists = await fs.pathExists(oldCacheRoot);
		if (!oldExists) {
			logger.info("[CacheManager] Old cache root missing; creating new one");
			await fs.ensureDir(newCacheRoot);
			return;
		}

		await fs.ensureDir(newCacheRoot);

		// Copy each known subdir.
		for (const subdir of Object.values(CACHE_SUBDIRS)) {
			const oldSubdir = path.join(oldCacheRoot, subdir);
			const newSubdir = path.join(newCacheRoot, subdir);
			if (await fs.pathExists(oldSubdir)) {
				logger.info(`[CacheManager] Copying ${subdir}...`);
				await fs.copy(oldSubdir, newSubdir, { overwrite: true });
			}
		}

		// Verify the copy landed in the new location.
		await this.verifyMigration(oldCacheRoot, newCacheRoot);

		// SAFETY: only ever remove the OLD CACHE ROOT, never any user-selected
		// base directory. oldCacheRoot is guaranteed to end with our fixed subdir.
		const basename = path.basename(oldCacheRoot);
		if (basename === CACHE_ROOT_SUBDIR) {
			logger.info(`[CacheManager] Removing old cache root: ${oldCacheRoot}`);
			await fs.remove(oldCacheRoot);
		} else {
			logger.warn(
				`[CacheManager] Refusing to remove old path (not our subdir): ${oldCacheRoot}`,
			);
		}
	}

	private async verifyMigration(oldCacheRoot: string, newCacheRoot: string): Promise<void> {
		for (const subdir of Object.values(CACHE_SUBDIRS)) {
			const oldSubdir = path.join(oldCacheRoot, subdir);
			const newSubdir = path.join(newCacheRoot, subdir);
			const oldExists = await fs.pathExists(oldSubdir);
			const newExists = await fs.pathExists(newSubdir);
			if (oldExists && !newExists) {
				throw new Error(`Migration verification failed: ${subdir} not copied`);
			}
		}
	}

	// ********************************************************************************* //
	// Info / clear / reset
	// ********************************************************************************* //

	private async getDirectorySize(dirPath: string): Promise<number> {
		let size = 0;
		try {
			if (!(await fs.pathExists(dirPath))) return 0;
			const entries = await fs.readdir(dirPath, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dirPath, entry.name);
				if (entry.isDirectory()) {
					size += await this.getDirectorySize(fullPath);
				} else {
					const stats = await fs.stat(fullPath);
					size += stats.size;
				}
			}
		} catch (error) {
			logger.error(`[CacheManager] Error calculating size for ${dirPath}:`, error);
		}
		return size;
	}

	async getCacheInfo(): Promise<CacheInfo> {
		const root = this.getCacheRoot();
		const tempSize = await this.getDirectorySize(this.getTempCacheDir());
		return {
			path: root,
			size: tempSize,
			subdirs: {
				temp: { path: this.getTempCacheDir(), size: tempSize },
			},
		};
	}

	async clearAllCache(): Promise<void> {
		logger.info("[CacheManager] Clearing all cache");
		const dirs = [this.getTempCacheDir()];
		for (const dir of dirs) {
			try {
				if (await fs.pathExists(dir)) {
					await fs.emptyDir(dir);
					logger.info(`[CacheManager] Cleared ${dir}`);
				}
			} catch (error) {
				logger.error(`[CacheManager] Failed to clear ${dir}:`, error);
			}
		}
	}

	/**
	 * Reset to the default cache location. The persisted custom base is cleared
	 * so subsequent launches use the system temp dir again.
	 */
	async resetToDefault(): Promise<void> {
		const defaultBase = this.getDefaultBase();
		await this.setCacheDirectory(defaultBase);

		const currentSettings = await generalSettingsStorage.getItemInternal("state");
		if (currentSettings) {
			await generalSettingsStorage.setItemInternal("state", {
				...currentSettings,
				cacheDirectory: undefined,
			});
		}
	}
}

// Singleton instance
export const cacheManager = new CacheManager();

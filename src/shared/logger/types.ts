export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type MainProcessCategory =
	| "main"
	| "apis"
	| "server"
	| "services"
	| "factories"
	| "utils"
	| "preload";

export type RendererProcessCategory =
	| "ui"
	| "chat"
	| "state"
	| "provider"
	| "theme"
	| "session"
	| "apis";

export type LogCategory = MainProcessCategory | RendererProcessCategory;

export interface Logger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	debug(message: string, ...args: any[]): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	info(message: string, ...args: any[]): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	warn(message: string, ...args: any[]): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error(message: string, ...args: any[]): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fatal(message: string, ...args: any[]): void;
}

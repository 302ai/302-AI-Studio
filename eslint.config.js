import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";
import globals from "globals";
import { fileURLToPath } from "node:url";
import svelteParser from "svelte-eslint-parser";
import ts from "typescript-eslint";
import svelteConfig from "./svelte.config.js";
const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));
export default defineConfig([
	includeIgnoreFile(gitignorePath),
	{
		ignores: ["src/routes/demo/**/*", ".claude/**/*", ".agents/**/*", "**/*.d.ts"],
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	...svelte.configs.prettier,
	prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
		rules: {
			"no-undef": "off",
			"no-console": "error",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
		},
	},
	{
		files: ["scripts/**/*", "vite-plugins/**/*", "forge.config.ts"],
		rules: {
			"no-console": "off",
		},
	},
	{
		files: ["**/generated/**/*.ts"],
		rules: {
			"@typescript-eslint/no-empty-object-type": [
				"error",
				{
					allowInterfaces: "always",
				},
			],
		},
	},
	{
		files: ["**/*.svelte.ts", "**/*.svelte"],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				extraFileExtensions: [".svelte"],
				svelteConfig,
				parser: {
					ts: tsParser,
					typescript: tsParser,
				},
			},
		},
		rules: {
			"svelte/no-navigation-without-resolve": "off",
		},
	},
	{
		files: ["**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				parser: tsParser,
			},
		},
	},
]);

import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { resolve, normalize, dirname } from "node:path";
import tailwindcss from "@tailwindcss/vite";

import injectProcessEnvPlugin from "rollup-plugin-inject-process-env";
import tsconfigPathsPlugin from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

import { settings } from "./src/lib/electron-router-dom";
import { main, resources } from "./package.json";

const [nodeModules, devFolder] = normalize(dirname(main)).split(/\/|\\/g);
const devPath = [nodeModules, devFolder].join("/");

const tsconfigPaths = tsconfigPathsPlugin({
  projects: [resolve("tsconfig.json")],
});

export default defineConfig({
  main: {
    plugins: [tsconfigPaths, externalizeDepsPlugin()],

    resolve: {
      alias: {
        "@": resolve("."),
        "@lib": resolve("src/lib"),
        "@main": resolve("src/main"),
        "@renderer": resolve("src/renderer"),
        "@shared": resolve("src/shared"),
      },
    },

    build: {
      rollupOptions: {
        input: {
          index: resolve("src/main/index.ts"),
        },

        output: {
          dir: resolve(devPath, "main"),
        },
      },
    },
  },

  preload: {
    plugins: [tsconfigPaths, externalizeDepsPlugin()],

    build: {
      outDir: resolve(devPath, "preload"),
    },
  },

  renderer: {
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
      "process.platform": JSON.stringify(process.platform),
    },

    resolve: {
      alias: {
        "@renderer": resolve("src/renderer"),
        "@shared": resolve("src/shared"),
        "@lib": resolve("src/lib"),
      },
    },

    server: {
      port: settings.port,
    },

    plugins: [
      tsconfigPaths,
      tailwindcss(),
      react(),

      codeInspectorPlugin({
        bundler: "vite",
        hotKeys: ["altKey"],
        hideConsole: true,
      }),
    ],

    publicDir: resolve(resources, "public"),

    build: {
      outDir: resolve(devPath, "renderer"),

      rollupOptions: {
        plugins: [
          injectProcessEnvPlugin({
            NODE_ENV: "production",
            platform: process.platform,
          }),
        ],

        input: {
          index: resolve("src/renderer/index.html"),
        },

        output: {
          dir: resolve(devPath, "renderer"),
        },
      },
    },
  },
});

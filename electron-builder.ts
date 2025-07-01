import {
  main,
  name,
  version,
  resources,
  description,
  author as _author,
  productName,
} from "./package.json";
import type { Configuration } from 'electron-builder'
import { getDevFolder } from "./src/lib/electron-app/release/utils/path";

const author = _author?.name ?? _author
const currentYear = new Date().getFullYear();
const authorInKebabCase = author.replace(/\s+/g, "-");
const appId = `com.${authorInKebabCase}.${name}`.toLowerCase();

export default {
  appId,
  productName: productName,
  copyright: `Copyright © ${currentYear} — ${author}`,

  directories: {
    app: getDevFolder(main),
    output: `dist/${version}`,
  },

  asarUnpack: ["**/node_modules/sharp/**/*", "**/node_modules/@img/**/*"],

  mac: {
    artifactName: [
      `${name}-${version}`,
      "-mac",
      "-${arch}.${ext}",
    ].join(""),
    icon: `${resources}/build/icons/302ai.png`,
    category: "public.app-category.utilities",
    gatekeeperAssess: false,
    hardenedRuntime: true,
    entitlementsInherit: `${resources}/build/mac/entitlements.mac.plist`,
    target: [
      {
        target: "dmg",
        arch: ["x64", "arm64", "universal"],
      },
      {
        target: "zip",
        arch: ["x64", "arm64", "universal"],
      }
    ],
  },

  afterSign: "electron-builder-notarize",

  linux: {
    artifactName: [
      `${name}-${version}`,
      "-${os}.${ext}",
    ].join(""),
    category: "Utilities",
    synopsis: description,
    target: ["AppImage", "deb", "pacman", "freebsd", "rpm"],
  },

  win: {
    executableName: productName,
    artifactName: [
      `${name}-${version}`,
      "-setup",
      "-${arch}.${ext}",
    ].join(""),
    icon: `${resources}/build/icons/win-logo.ico`,
    target: [
      {
        target: "nsis",
        arch: ["x64", "arm64"],
      },
    ],
  },

  nsis: {
    artifactName: [
      `${name}-${version}`,
      "-setup",
      "-${arch}.${ext}",
    ].join(""),
    shortcutName: productName,
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
} satisfies Configuration;

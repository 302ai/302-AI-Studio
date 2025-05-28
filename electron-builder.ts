import {
  main,
  name,
  version,
  resources,
  description,
  displayName,
  author as _author,
} from "./package.json";

import { getDevFolder } from "./src/lib/electron-app/release/utils/path";

const author = _author ?? _author;
const currentYear = new Date().getFullYear();
const authorInKebabCase = author.replace(/\s+/g, "-");
const appId = `com.${authorInKebabCase}.${name}`.toLowerCase();

const artifactName = [`${name}-v${version}`, "-${os}.${ext}"].join("");
const artifactNameSetup = [
  `${name}-v${version}`,
  "-Setup",
  "-${os}.${ext}",
].join("");

export default {
  appId,
  productName: displayName,
  copyright: `Copyright © ${currentYear} — ${author}`,

  directories: {
    app: getDevFolder(main),
    output: `dist/v${version}`,
  },

  mac: {
    artifactName,
    icon: `${resources}/build/icons/icon.icns`,
    category: "public.app-category.utilities",
    target: ["zip", "dmg", "dir"],
  },

  linux: {
    artifactName,
    category: "Utilities",
    synopsis: description,
    target: ["AppImage", "deb", "pacman", "freebsd", "rpm"],
  },

  win: {
    executableName: displayName,
    artifactName: artifactNameSetup,
    icon: `${resources}/build/icons/icon.ico`,
    target: [
      {
        target: "nsis",
        arch: ["x64", "arm64"],
      },
    ],
  },

  nsis: {
    artifactName: artifactNameSetup,
    shortcutName: displayName,
    uninstallDisplayName: displayName,
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
};

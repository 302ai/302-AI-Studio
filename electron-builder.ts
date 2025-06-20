  import {
  main,
  name,
  version,
  resources,
  description,
  displayName,
  author as _author,
  productName,
} from "./package.json";
import type { Configuration } from 'electron-builder'
import { getDevFolder } from "./src/lib/electron-app/release/utils/path";

const author = _author?.name ?? _author
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
  productName: productName,
  copyright: `Copyright © ${currentYear} — ${author}`,

  directories: {
    app: getDevFolder(main),
    output: `dist/v${version}`,
  },

  mac: {
    artifactName,
    icon: `${resources}/build/icons/302ai.png`,
    category: "public.app-category.utilities",
    target: [
      {
        target: "dmg",
        arch: ["x64", "arm64"],
      },
      {
        target: "zip",
        arch: ["x64", "arm64"],
      }
    ],
  },

  linux: {
    artifactName,
    category: "Utilities",
    synopsis: description,
    target: ["AppImage", "deb", "pacman", "freebsd", "rpm"],
  },

  win: {
    executableName: productName,
    artifactName: artifactNameSetup,
    icon: `${resources}/build/icons/302ai.png`,
    target: [
      {
        target: "nsis",
        arch: ["x64", "arm64"],
      },
    ],
  },

  nsis: {
    artifactName: artifactNameSetup,
    shortcutName: productName,
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
} satisfies Configuration;

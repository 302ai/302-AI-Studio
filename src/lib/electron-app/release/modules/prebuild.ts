import { cp, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import packageJSON from "../../../../../package.json";
import trustedDependencies from "../../../../../trusted-dependencies-scripts.json";
import { getDevFolder } from "../utils/path";

async function createPackageJSONDistVersion() {
  const { main, ...rest } = packageJSON;

  const packageJSONDistVersion = {
    main: "./main/index.js",
    ...rest,
  };

  try {
    const devFolder = getDevFolder(main);
    const projectRoot = resolve(__dirname, "../../../../../");

    await Promise.all([
      writeFile(
        resolve(devFolder, "package.json"),
        JSON.stringify(packageJSONDistVersion, null, 2),
      ),
      writeFile(
        resolve(devFolder, "trusted-dependencies-scripts.json"),
        JSON.stringify(trustedDependencies, null, 2),
      ),
      // * Create empty yarn.lock file to avoid yarn error
      writeFile(resolve(devFolder, "yarn.lock"), ""),
      // * Copy .yarn folder to dev folder
      cp(resolve(projectRoot, ".yarn"), resolve(devFolder, ".yarn"), {
        recursive: true,
      }),
    ]);

    // biome-ignore lint/suspicious/noExplicitAny: ignore any
  } catch ({ message }: any) {
    console.log(`
    🛑 Something went wrong!\n
      🧐 There was a problem creating the package.json dist version...\n
      👀 Error: ${message}
    `);
  }
}

createPackageJSONDistVersion();

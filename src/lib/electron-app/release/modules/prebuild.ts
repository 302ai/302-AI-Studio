import { writeFile } from "node:fs/promises";
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
    await writeFile(
      resolve(getDevFolder(main), "package.json"),
      JSON.stringify(packageJSONDistVersion, null, 2)
    );

    await writeFile(
      resolve(getDevFolder(main), "trusted-dependencies-scripts.json"),
      JSON.stringify(trustedDependencies, null, 2)
    );
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

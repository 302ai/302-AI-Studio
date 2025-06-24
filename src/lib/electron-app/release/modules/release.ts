/** biome-ignore-all lint/suspicious/noExplicitAny: ignore any */
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import open from "open";
import packageJSON from "../../../../../package.json";
import { COLORS } from "../constants/colors";
import { exec } from "../utils/exec";
import { extractOwnerAndRepoFromGitRemoteURL } from "../utils/extractors";
import { question } from "../utils/question";
import { checkValidations, suggestNewVersion } from "../utils/validations";

async function makeRelease() {
  console.clear();

  const { version } = packageJSON;
  const suggestedVersion = suggestNewVersion(version);

  console.log(
    `${COLORS.CYAN}Current version: ${COLORS.GREEN}${version}${COLORS.RESET}`,
  );
  console.log(
    `${COLORS.CYAN}Suggested version: ${COLORS.GREEN}${suggestedVersion}${COLORS.RESET}\n`,
  );

  const newVersion = await question(
    `Enter a new version ${COLORS.SOFT_GRAY}(press Enter for suggested: ${suggestedVersion})${COLORS.RESET}: `,
  );

  const finalVersion = newVersion.trim() || suggestedVersion;

  if (checkValidations({ version, newVersion: finalVersion })) {
    return;
  }

  packageJSON.version = finalVersion;

  try {
    console.log(
      `${COLORS.CYAN}> Updating package.json version to ${finalVersion}...${COLORS.RESET}`,
    );

    await writeFile(
      resolve("package.json"),
      JSON.stringify(packageJSON, null, 2),
    );

    console.log(`\n${COLORS.GREEN}Done!${COLORS.RESET}\n`);
    console.log(`${COLORS.CYAN}> Trying to release it...${COLORS.RESET}`);

    // Use conventional commit format for release commits
    const commitMessage = `chore(release): bump version to ${finalVersion}`;

    exec(
      [
        `git commit -am "${commitMessage}"`,
        `git tag v${finalVersion}`,
        "git push",
        "git push --tags",
      ],
      {
        inherit: true,
      },
    );

    const [repository] = exec(["git remote get-url --push origin"]);
    const ownerAndRepo = extractOwnerAndRepoFromGitRemoteURL(repository);

    console.log(
      `${COLORS.BLUE}> Opening the repository releases page...${COLORS.RESET}`,
    );

    await open(`https://github.com/${ownerAndRepo}/releases`);

    console.log(
      `${COLORS.BLUE}> Opening the repository actions page...${COLORS.RESET}`,
    );

    await open(`https://github.com/${ownerAndRepo}/actions`);

    console.log(
      `\n${COLORS.GREEN}Release ${finalVersion} completed successfully!${COLORS.RESET}\n`,
    );
  } catch ({ message }: any) {
    console.log(`${COLORS.RED}>
    🛑 Something went wrong!\n
      👀 Error: ${message}
    `);
  }
}

makeRelease();

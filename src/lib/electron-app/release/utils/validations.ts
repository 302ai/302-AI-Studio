import { getWeek, getYear } from "date-fns";

import { COLORS } from "../constants/colors";

/**
 * Gets the current year-week string in YY.WW.0 format
 * Uses the last two digits of the current year and the ISO week number
 * @returns A string in format YY.WW.0 (e.g., "25.26.0" for 2025 week 26)
 */
function getCurrentYearWeek(): string {
  const now = new Date();
  const year = getYear(now).toString().slice(-2); // Get last two digits of year
  const week = getWeek(now).toString(); // Get ISO week number

  return `${year}.${week}.0`;
}

/**
 * Parses a version string in YY.WW.patch format
 * @param version - Version string to parse (e.g., "25.26.0" or "25.26.1")
 * @returns Object with year, week, and patch number, or null if invalid format
 */
function parseVersion(
  version: string,
): { year: string; week: string; patch: number; yearWeek: string } | null {
  const match = version.match(/^(\d{2})\.(\d{1,2})\.(\d+)$/);
  if (!match) return null;

  const year = match[1];
  const week = match[2];
  const patch = parseInt(match[3], 10);

  return {
    year,
    week,
    patch,
    yearWeek: `${year}.${week}`, // For year-week comparison
  };
}

/**
 * Validates if a version string follows the YY.WW.patch format
 * @param version - Version string to validate
 * @returns True if format is valid, false otherwise
 */
function isValidVersionFormat(version: string): boolean {
  return /^\d{2}\.\d{1,2}\.\d+$/.test(version);
}

/**
 * Compares two version objects to determine which is newer
 * @param current - Current version object
 * @param newVer - New version object
 * @returns -1 if new is older, 0 if equal, 1 if new is newer
 */
function compareVersions(
  current: ReturnType<typeof parseVersion>,
  newVer: ReturnType<typeof parseVersion>,
): number {
  if (!current || !newVer) return 0;

  // Compare year first
  const yearDiff = parseInt(newVer.year, 10) - parseInt(current.year, 10);
  if (yearDiff !== 0) return yearDiff > 0 ? 1 : -1;

  // Then compare week
  const weekDiff = parseInt(newVer.week, 10) - parseInt(current.week, 10);
  if (weekDiff !== 0) return weekDiff > 0 ? 1 : -1;

  // Finally compare patch
  const patchDiff = newVer.patch - current.patch;
  if (patchDiff !== 0) return patchDiff > 0 ? 1 : -1;

  return 0; // Equal
}

/**
 * Suggests the next appropriate version number based on current version and date
 * @param currentVersion - The current version string
 * @returns Suggested new version string
 * - If same year-week: increments patch number (e.g., "25.26.0" -> "25.26.1")
 * - If different year-week: returns new year-week base version (e.g., "25.25.0" -> "25.26.0")
 * - If current version is invalid: returns current year-week base version
 */
export function suggestNewVersion(currentVersion: string): string {
  const currentYearWeek = getCurrentYearWeek();
  const parsed = parseVersion(currentVersion);

  if (!parsed) {
    // If current version format is invalid, return current year-week base version
    return currentYearWeek;
  }

  if (parsed.yearWeek === currentYearWeek.split(".").slice(0, 2).join(".")) {
    // Same year-week, increment patch number
    return `${parsed.year}.${parsed.week}.${parsed.patch + 1}`;
  } else {
    // New year-week, return base version
    return currentYearWeek;
  }
}

/**
 * Validates new version against current version with comprehensive checks
 * @param version - Current version string
 * @param newVersion - Proposed new version string
 * @returns True if validation fails (should abort), false if validation passes (can proceed)
 */
export function checkValidations({
  version,
  newVersion,
}: {
  version: string;
  newVersion: string;
}) {
  // Check if new version is provided
  if (!newVersion) {
    console.log(`${COLORS.RED}No version entered${COLORS.RESET}`);
    return true;
  }

  // Validate version format
  if (!isValidVersionFormat(newVersion)) {
    console.log(
      `${COLORS.RED}Version must have format YY.WW.patch (${COLORS.SOFT_GRAY}25.26.0 or 25.26.1${COLORS.RESET} example: ${COLORS.GREEN}${getCurrentYearWeek()}${COLORS.RESET}${COLORS.RED})${COLORS.RESET}`,
    );
    return true;
  }

  // Allow test versions to skip validation
  if (newVersion.endsWith("test")) {
    console.log(
      `${COLORS.GREEN}Test version detected, skipping version comparison${COLORS.RESET}`,
    );
    return false;
  }

  // Parse both versions for comparison
  const currentParsed = parseVersion(version);
  const newParsed = parseVersion(newVersion);

  // If current version doesn't follow new format, allow any valid new format
  if (!currentParsed) {
    console.log(
      `${COLORS.YELLOW}Current version (${version}) doesn't follow YY.WW.patch format, allowing new format version${COLORS.RESET}`,
    );
    return false;
  }

  if (!newParsed) {
    console.log(
      `${COLORS.RED}Unable to parse new version format${COLORS.RESET}`,
    );
    return true;
  }

  // Compare versions using the new comparison logic
  const comparison = compareVersions(currentParsed, newParsed);

  if (comparison < 0) {
    console.log(
      `${COLORS.RED}New version (${newVersion}) is earlier than current version (${version})${COLORS.RESET}`,
    );
    return true;
  }

  if (comparison === 0) {
    console.log(
      `${COLORS.RED}New version (${newVersion}) is equal to current version (${version})${COLORS.RESET}`,
    );
    return true;
  }

  // Additional validation: ensure patch increment is reasonable for same year-week
  if (currentParsed.yearWeek === newParsed.yearWeek) {
    if (newParsed.patch !== currentParsed.patch + 1) {
      console.log(
        `${COLORS.YELLOW}Warning: Patch version jumped from ${currentParsed.patch} to ${newParsed.patch} for the same year-week${COLORS.RESET}`,
      );
    }
  }

  // All validations passed
  return false;
}

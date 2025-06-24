import { getWeek, getYear } from "date-fns";

import { COLORS } from "../constants/colors";

/**
 * Gets the current year-week string in YYWW format
 * Uses the last two digits of the current year and the ISO week number
 * @returns A string in format YYWW (e.g., "2526" for 2025 week 26)
 */
function getCurrentYearWeek(): string {
  const now = new Date();
  const year = getYear(now).toString().slice(-2); // Get last two digits of year
  const week = getWeek(now).toString().padStart(2, "0"); // Get ISO week number with zero padding

  return `${year}${week}`;
}

/**
 * Parses a version string in YYWW[.patch] format
 * @param version - Version string to parse (e.g., "2526" or "2526.1")
 * @returns Object with yearWeek and patch number, or null if invalid format
 */
function parseVersion(
  version: string,
): { yearWeek: string; patch: number } | null {
  const match = version.match(/^(\d{4})(?:\.(\d+))?$/);
  if (!match) return null;

  return {
    yearWeek: match[1],
    patch: match[2] ? parseInt(match[2], 10) : 0,
  };
}

/**
 * Validates if a version string follows the YYWW[.patch] format
 * @param version - Version string to validate
 * @returns True if format is valid, false otherwise
 */
function isValidVersionFormat(version: string): boolean {
  return /^\d{4}(?:\.\d+)?$/.test(version);
}

/**
 * Suggests the next appropriate version number based on current version and date
 * @param currentVersion - The current version string
 * @returns Suggested new version string
 * - If same year-week: increments patch number (e.g., "2526" -> "2526.1")
 * - If different year-week: returns new year-week base version (e.g., "2525" -> "2526")
 * - If current version is invalid: returns current year-week
 */
export function suggestNewVersion(currentVersion: string): string {
  const currentYearWeek = getCurrentYearWeek();
  const parsed = parseVersion(currentVersion);

  if (!parsed) {
    // If current version format is invalid, return current year-week base version
    return currentYearWeek;
  }

  if (parsed.yearWeek === currentYearWeek) {
    // Same week, increment patch number
    return `${currentYearWeek}.${parsed.patch + 1}`;
  } else {
    // New week, return base version
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
      `${COLORS.RED}Version must have format YYWW[.patch] (${COLORS.SOFT_GRAY}2526 or 2526.1${COLORS.RESET} example: ${COLORS.GREEN}${getCurrentYearWeek()}${COLORS.RESET}${COLORS.RED})${COLORS.RESET}`,
    );
    return true;
  }

  // Parse both versions for comparison
  const currentParsed = parseVersion(version);
  const newParsed = parseVersion(newVersion);

  if (!currentParsed || !newParsed) {
    console.log(
      `${COLORS.YELLOW}Warning: Unable to parse version format, proceeding...${COLORS.RESET}`,
    );
    return false;
  }

  // Compare year-week values
  const currentYearWeekNum = parseInt(currentParsed.yearWeek, 10);
  const newYearWeekNum = parseInt(newParsed.yearWeek, 10);

  // Check if new version year-week is earlier than current
  if (newYearWeekNum < currentYearWeekNum) {
    console.log(
      `${COLORS.RED}New version year-week (${newParsed.yearWeek}) is earlier than current (${currentParsed.yearWeek})${COLORS.RESET}`,
    );
    return true;
  }

  // Check if patch number is valid for same year-week
  if (
    newYearWeekNum === currentYearWeekNum &&
    newParsed.patch <= currentParsed.patch
  ) {
    console.log(
      `${COLORS.RED}New version patch number must be higher than current for the same year-week${COLORS.RESET}`,
    );
    return true;
  }

  // All validations passed
  return false;
}

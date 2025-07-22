/**
 * Converts a number to its base64 representation
 * @param num - The number to convert to base64
 * @returns The base64 encoded string representation of the number
 * @throws Error if the input is not a valid number
 */
export function numberToBase64(num: number): string {
  if (!Number.isFinite(num)) {
    throw new Error("Input must be a finite number");
  }

  const numString = num.toString();
  const buffer = Buffer.from(numString, "utf8");
  return buffer.toString("base64");
}

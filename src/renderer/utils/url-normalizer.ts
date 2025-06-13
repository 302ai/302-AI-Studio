/**
 * URL Normalization Utility
 * Handles various Base URL formats input by users, generates standardized Base URLs and complete API endpoints
 */

export interface NormalizedUrlResult {
  /** Normalized Base URL */
  normalizedBaseUrl: string;
  /** Complete API endpoint example */
  fullApiEndpoint: string;
  /** Whether URL is valid */
  isValid: boolean;
  /** Error message (if any) */
  error?: string;
}

/**
 * Get standard path suffix based on API type
 */
function getApiPathSuffix(apiType: string): string {
  switch (apiType) {
    case "openai":
    case "openai-responses":
    case "moonshot":
    case "silicon":
    case "deepseek":
    case "dashscope":
    case "github":
    case "qiniu":
    case "ppio":
    case "aihubmix":
    case "openrouter":
    case "hunyuan":
      return "/v1";
    case "gemini":
      return "/v1beta";
    case "anthropic":
      return ""; // Anthropic doesn't need version number
    case "ollama":
      return "/api";
    case "doubao":
      return "/v3";
    case "minimax":
      return "/v1";
    case "fireworks":
      return "/v1";
    case "zhipu":
      return "/api/paas/v4";
    case "grok":
      return "/v1";
    case "lmstudio":
      return "/v1";
    default:
      return "/v1"; // Default to v1
  }
}

/**
 * Get example endpoint based on API type
 */
function getExampleEndpoint(apiType: string): string {
  switch (apiType) {
    case "openai":
    case "openai-responses":
    case "moonshot":
    case "silicon":
    case "deepseek":
    case "dashscope":
    case "github":
    case "qiniu":
    case "ppio":
    case "aihubmix":
    case "openrouter":
    case "hunyuan":
    case "grok":
    case "lmstudio":
      return "/chat/completions";
    case "gemini":
      return "/models/gemini-pro:generateContent";
    case "anthropic":
      return "/v1/messages";
    case "ollama":
      return "/chat";
    case "doubao":
      return "/chat/completions";
    case "minimax":
      return "/text/chatcompletion_v2";
    case "fireworks":
      return "/chat/completions";
    case "zhipu":
      return "/chat/completions";
    default:
      return "/chat/completions";
  }
}

/**
 * Normalize user input Base URL
 */
export function normalizeBaseUrl(
  inputUrl: string,
  apiType: string = "openai",
  t?: (key: string) => string,
): NormalizedUrlResult {
  // Return error if input is empty
  if (!inputUrl.trim()) {
    return {
      normalizedBaseUrl: "",
      fullApiEndpoint: "",
      isValid: false,
      error: t ? t("url-empty-error") : "URL cannot be empty",
    };
  }

  try {
    let cleanUrl = inputUrl.trim();

    // Add https:// if no protocol specified
    if (!cleanUrl.match(/^https?:\/\//)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // Create URL object for validation and normalization
    const url = new URL(cleanUrl);

    // Remove trailing slashes
    let pathname = url.pathname.replace(/\/+$/, "");

    // Get expected path suffix
    const expectedSuffix = getApiPathSuffix(apiType);

    // Keep path if it already has correct suffix
    // Otherwise add correct suffix
    if (!pathname.endsWith(expectedSuffix)) {
      // Special handling: If user input has /v1, /v2 etc version but not expected one, replace it
      const versionPattern = /\/v\d+$/;
      if (versionPattern.test(pathname) && expectedSuffix.startsWith("/v")) {
        pathname = pathname.replace(versionPattern, expectedSuffix);
      } else if (pathname.endsWith("/api") && expectedSuffix === "/api") {
        // For ollama etc using /api, if already exists don't duplicate
        // Keep as is
      } else if (pathname.includes("/api/paas/v") && apiType === "zhipu") {
        // For Zhipu's special path, check version if already contains api/paas/v
        if (!pathname.endsWith("/api/paas/v4")) {
          pathname = pathname.replace(/\/api\/paas\/v\d+$/, "/api/paas/v4");
        }
      } else {
        pathname += expectedSuffix;
      }
    }

    // Build normalized Base URL
    const normalizedBaseUrl = `${url.protocol}//${url.host}${pathname}`;

    // Build complete API endpoint example
    const exampleEndpoint = getExampleEndpoint(apiType);
    const fullApiEndpoint = `${normalizedBaseUrl}${exampleEndpoint}`;

    return {
      normalizedBaseUrl,
      fullApiEndpoint,
      isValid: true,
    };
  } catch (_error) {
    return {
      normalizedBaseUrl: inputUrl,
      fullApiEndpoint: "",
      isValid: false,
      error: t ? t("url-invalid-format") : "Invalid URL format",
    };
  }
}

/**
 * Check if two URLs are equivalent after normalization
 */
export function areUrlsEquivalent(
  url1: string,
  url2: string,
  apiType: string = "openai",
): boolean {
  const result1 = normalizeBaseUrl(url1, apiType);
  const result2 = normalizeBaseUrl(url2, apiType);

  return (
    result1.isValid &&
    result2.isValid &&
    result1.normalizedBaseUrl === result2.normalizedBaseUrl
  );
}

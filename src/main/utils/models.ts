import type { CreateModelData } from "@shared/triplit/types";

export const NOT_SUPPORTED_REGEX = /(?:^tts|whisper|speech|tts$)/i;

export function isSupportedModel(model: CreateModelData): boolean {
  if (!model) {
    return false;
  }

  return !NOT_SUPPORTED_REGEX.test(model.name);
}

export const MODEL_LIST_CONFIGS = {
  anthropic: {
    functionCall: ["claude"],
    reasoning: ["thinking"],
    vision: ["claude"],
  },
  deepseek: {
    functionCall: ["v3", "r1"],
    reasoning: ["r1"],
    vision: [],
  },
  google: {
    functionCall: ["gemini"],
    reasoning: ["thinking", "-2.5-"],
    vision: ["gemini", "learnlm"],
  },
  llama: {
    functionCall: ["llama-3.2", "llama-3.3", "llama-4"],
    reasoning: [],
    vision: [],
  },
  openai: {
    functionCall: ["4o", "4.1", "o3", "o4"],
    reasoning: ["o1", "o3", "o4"],
    vision: ["4o", "4.1", "o4"],
  },
  qwen: {
    functionCall: [
      "qwen-max",
      "qwen-plus",
      "qwen-turbo",
      "qwen-long",
      "qwen1.5",
      "qwen2",
      "qwen2.5",
      "qwen3",
    ],
    reasoning: ["qvq", "qwq", "qwen3"],
    vision: ["qvq", "vl"],
  },
  v0: {
    functionCall: ["v0"],
    reasoning: ["v0-1.5"],
    vision: ["v0"],
  },
  volcengine: {
    functionCall: ["doubao-1.5"],
    reasoning: ["thinking", "-r1"],
    vision: ["vision", "-m"],
  },
  zeroone: {
    functionCall: ["fc"],
    reasoning: [],
    vision: ["vision"],
  },
  zhipu: {
    functionCall: ["glm-4", "glm-z1"],
    reasoning: ["glm-zero", "glm-z1"],
    vision: ["glm-4v"],
  },
} as const;

export const PROVIDER_DETECTION_CONFIG = {
  anthropic: ["claude"],
  deepseek: ["deepseek"],
  google: ["gemini"],
  llama: ["llama"],
  openai: ["o1", "o3", "o4", "gpt-"],
  qwen: ["qwen", "qwq", "qvq"],
  v0: ["v0"],
  volcengine: ["doubao"],
  zeroone: ["yi-"],
  zhipu: ["glm"],
} as const;

export const detectModelProvider = (
  modelId: string,
): keyof typeof MODEL_LIST_CONFIGS => {
  const lowerModelId = modelId.toLowerCase();

  for (const [provider, keywords] of Object.entries(
    PROVIDER_DETECTION_CONFIG,
  )) {
    const hasKeyword = keywords.some((keyword) =>
      lowerModelId.includes(keyword),
    );

    if (hasKeyword && provider in MODEL_LIST_CONFIGS) {
      return provider as keyof typeof MODEL_LIST_CONFIGS;
    }
  }

  return "openai";
};

export function parseModels(
  modelId: string,
  keywords: string[] = ["functionCall", "reasoning", "vision"],
) {
  const provider = detectModelProvider(modelId);
  const config = MODEL_LIST_CONFIGS[provider];
  const capabilities = new Set<string>();
  const lowerModelId = modelId.toLowerCase();

  for (const keywordType of keywords) {
    switch (keywordType) {
      case "functionCall":
        if (
          config.functionCall?.some((keyword) =>
            lowerModelId.includes(keyword.toLowerCase()),
          )
        ) {
          capabilities.add("function_call");
        }
        break;

      case "reasoning":
        if (
          config.reasoning?.some((keyword) =>
            lowerModelId.includes(keyword.toLowerCase()),
          )
        ) {
          capabilities.add("reasoning");
        }
        break;

      case "vision":
        if (
          config.vision?.some((keyword) =>
            lowerModelId.includes(keyword.toLowerCase()),
          )
        ) {
          capabilities.add("vision");
        }
        break;
    }
  }

  return capabilities;
}

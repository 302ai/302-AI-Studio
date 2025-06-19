import type { CreateModelData } from "@shared/triplit/types";

export const NOT_SUPPORTED_REGEX = /(?:^tts|whisper|speech|tts$)/i;

export function isSupportedModel(model: CreateModelData): boolean {
  if (!model) {
    return false;
  }

  return !NOT_SUPPORTED_REGEX.test(model.name);
}

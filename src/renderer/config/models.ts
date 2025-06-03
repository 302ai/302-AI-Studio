import type { Model } from "@shared/types/model";

export const NOT_SUPPORTED_REGEX = /(?:^tts|whisper|speech)/i;

export function isSupportedModel(model: Model): boolean {
  if (!model) {
    return false;
  }

  return !NOT_SUPPORTED_REGEX.test(model.id);
}

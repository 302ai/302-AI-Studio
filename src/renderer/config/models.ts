import type OpenAI from "openai";

export const NOT_SUPPORTED_REGEX = /(?:^tts|whisper|speech)/i;

export function isSupportedModel(model: OpenAI.Models.Model): boolean {
  if (!model) {
    return false;
  }

  return !NOT_SUPPORTED_REGEX.test(model.id);
}

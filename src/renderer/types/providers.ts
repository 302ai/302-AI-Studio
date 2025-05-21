// * Model Provider Settings Types
export type ProviderType =
  | "openai"
  | "openai-compatible"
  | "anthropic"
  | "gemini"
  | "qwenlm"
  | "azure-openai";
export type Model = {
  id: string;
  provider: string;
  name: string;
  group: string;
};
export interface ModelProvider {
  id: string;
  type: ProviderType;
  name: string;
  apiKey: string;
  apiHost: string;
  apiVersion?: string;
  models: Model[];
  enabled: boolean;
  isSystem: boolean;
}

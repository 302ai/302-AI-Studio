// * Model Provider Settings Types
export interface ModelProvider {
  id: string;
  name: string;
  apiType: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  custom: boolean;
  websites?: {
    official: string;
    apiKey: string;
    docs: string;
    models: string;
    defaultBaseUrl: string;
  };
}

import type { ModelProvider } from "@/src/renderer/types/providers";

export abstract class BaseProviderService {
  protected provider: ModelProvider;

  constructor(provider: ModelProvider) {
    this.provider = provider;
  }

  public abstract checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }>;
}

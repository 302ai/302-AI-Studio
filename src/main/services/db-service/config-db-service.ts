import { triplitClient } from "@main/triplit/client";
import type { schema } from "@shared/triplit/schema";
import type {
  CreateModelData,
  CreateProviderData,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import type { TriplitClient } from "@triplit/client";

export class ConfigDbService {
  private client: TriplitClient<typeof schema>;

  constructor() {
    this.client = triplitClient;
    this.client.connect();
  }

  async insertProvider(provider: CreateProviderData) {
    console.log("insertProvider", provider);
    const query = this.client.query("providers");
    console.log("query", query);
    const existingProviders = await this.client.fetch(query);
    console.log("existingProviders", existingProviders);
    const maxOrder = existingProviders.reduce(
      (max, p) => Math.max(max, p.order || 0),
      -1,
    );
    console.log("maxOrder", maxOrder);

    return await this.client.insert("providers", {
      ...provider,
      order: maxOrder + 1,
    });
  }

  async deleteProvider(providerId: string) {
    await this.client.delete("providers", providerId);
    await this.reorderProviders();
  }

  async updateProvider(providerId: string, provider: UpdateProviderData) {
    await this.client.update("providers", providerId, provider);
    await this.reorderProviders();
  }

  async getProviders(): Promise<Provider[]> {
    const query = this.client.query("providers").Where("enabled", "=", true);
    const providers = await this.client.fetch(query);
    return providers;
  }

  async insertModels(models: CreateModelData[]) {
    const addModels = models.map((model) => {
      return this.client.insert("models", model);
    });

    await Promise.all(addModels);
  }

  async deleteModels(providerId: string) {
    const query = this.client
      .query("models")
      .Where("providerId", "=", providerId);
    const models = await this.client.fetch(query);
    const deleteModels = models.map((model) => {
      return this.client.delete("models", model.id);
    });
    await Promise.all(deleteModels);
  }

  private async reorderProviders() {
    const query = this.client.query("providers").Order("order", "ASC");
    const providers = await this.client.fetch(query);

    const updatePromises = providers.map((provider, index) => {
      return this.client.update("providers", provider.id, {
        order: index,
      });
    });

    await Promise.all(updatePromises);
  }
}

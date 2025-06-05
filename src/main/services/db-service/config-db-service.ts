import type {
  CreateModelData,
  CreateProviderData,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import { BaseDbService } from "./base-db-service";

export class ConfigDbService extends BaseDbService {
  async insertProvider(provider: CreateProviderData) {
    const query = this.client.query("providers")
    const existingProviders = await this.client.fetch(query);
    const maxOrder = existingProviders.reduce(
      (max, p) => Math.max(max, p.order || 0),
      -1,
    );

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

  private async reorderProviders() {
    const query = this.client
      .query("providers")
      .Order("order", "ASC");
    const providers = await this.client.fetch(query);

    const updatePromises = providers.map((provider, index) => {
      return this.client.update("providers", provider.id, {
        order: index,
      });
    });

    await Promise.all(updatePromises);
  }
}

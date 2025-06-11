import { triplitClient } from "@main/triplit/client";
import type {
  CreateModelData,
  CreateProviderData,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";

export class ConfigDbService {
  constructor() {
    triplitClient.connect();
  }

  async insertProvider(provider: CreateProviderData) {
    const query = triplitClient.query("providers");
    const existingProviders = await triplitClient.fetch(query);
    const maxOrder = existingProviders.reduce(
      (max, p) => Math.max(max, p.order || 0),
      -1,
    );

    return await triplitClient.insert("providers", {
      ...provider,
      order: maxOrder + 1,
    });
  }

  async deleteProvider(providerId: string) {
    const providerQuery = triplitClient
      .query("providers")
      .Where("id", "=", providerId)
      .Include("models");
    const providerData = await triplitClient.fetchOne(providerQuery);

    if (!providerData) {
      return;
    }

    if (providerData.models && providerData.models.length > 0) {
      const deleteModels = providerData.models.map((model) => {
        return triplitClient.delete("models", model.id);
      });
      await Promise.all(deleteModels);
    }

    await triplitClient.delete("providers", providerId);

    await this.reorderProviders();
  }

  async updateProvider(providerId: string, updateData: UpdateProviderData) {
    await triplitClient.update("providers", providerId, updateData);
    await this.reorderProviders();
  }

  async getProviders(): Promise<Provider[]> {
    const query = triplitClient.query("providers").Order("order", "ASC");
    const providers = await triplitClient.fetch(query);
    return providers;
  }

  async insertModels(models: CreateModelData[]) {
    const addModels = models.map((model) => {
      return triplitClient.insert("models", model);
    });

    await Promise.all(addModels);
  }

  private async reorderProviders() {
    const query = triplitClient.query("providers").Order("order", "ASC");
    const providers = await triplitClient.fetch(query);

    const updatePromises = providers.map((provider, index) => {
      return triplitClient.update("providers", provider.id, {
        order: index,
      });
    });

    await Promise.all(updatePromises);
  }
}

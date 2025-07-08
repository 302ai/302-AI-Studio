import { triplitClient } from "@main/triplit/client";
import { DEFAULT_PROVIDERS } from "@shared/providers";
import type {
  CreateModelData,
  CreateProviderData,
  Provider,
  UpdateProviderData,
} from "@shared/triplit/types";
import logger from "@shared/logger/main-logger";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";

@injectable()
export class ConfigDbService extends BaseDbService {
  private providersRecord: Provider[] = [];

  constructor() {
    super("providers");
    this.initConfigDbService();
  }

  private async initConfigDbService() {
    const query = triplitClient.query("providers");
    const providers = await triplitClient.fetch(query);
    this.providersRecord = providers;
    this.initProviders();
  }

  private async initProviders() {
    for (const provider of DEFAULT_PROVIDERS) {
      const existingProvider = this.providersRecord.find(
        (p) => p.name === provider.name,
      );
      if (!existingProvider) {
        await this.insertProvider(provider);
      }
    }
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
    const providerModelsQuery = triplitClient
      .query("providers")
      .Where("id", "=", providerId)
      .Include("models");
    const providerModelsData =
      await triplitClient.fetchOne(providerModelsQuery);

    if (!providerModelsData) {
      return;
    }

    if (providerModelsData.models && providerModelsData.models.length > 0) {
      const deleteModels = providerModelsData.models.map((model) => {
        return triplitClient.delete("models", model.id);
      });
      await Promise.all(deleteModels);
    }

    await triplitClient.delete("providers", providerId);

    await this.reorderProviders();
  }

  async updateProvider(providerId: string, updateData: UpdateProviderData) {
    const existingProvider = await this.getProviderById(providerId);
    if (!existingProvider) {
      logger.error("Provider not found, skipping update", { providerId });
      return;
    }

    await triplitClient.update("providers", providerId, async (provider) => {
      Object.assign(provider, updateData);
    });
  }

  async updateProviderOrder(providerId: string, order: number) {
    const existingProvider = await this.getProviderById(providerId);
    if (!existingProvider) {
      logger.error("Provider not found, skipping update", { providerId });
      return;
    }

    await triplitClient.update("providers", providerId, async (provider) => {
      provider.order = order;
    });
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

  async updateProviderModels(providerId: string, models: CreateModelData[]) {
    const modelsQuery = triplitClient
      .query("models")
      .Where("providerId", "=", providerId);
    const existingModels = await triplitClient.fetch(modelsQuery);

    const existingModelNames = new Set(
      existingModels.map((model) => model.name),
    );
    const newModelNames = new Set(models.map((model) => model.name));

    const deletedModelIds = existingModels
      .filter((model) => !newModelNames.has(model.name))
      .map((model) => model.id);

    const modelsToAdd = models.filter(
      (model) => !existingModelNames.has(model.name),
    );

    if (deletedModelIds.length > 0 || modelsToAdd.length > 0) {
      await triplitClient.transact(async (tx) => {
        if (deletedModelIds.length > 0) {
          const deletePromises = deletedModelIds.map((modelId) => {
            return tx.delete("models", modelId);
          });
          await Promise.all(deletePromises);

          const threadsQuery = triplitClient.query("threads");
          const allThreads = await triplitClient.fetch(threadsQuery);

          const threadsToUpdate = allThreads.filter((thread) =>
            deletedModelIds.includes(thread.modelId),
          );
          if (threadsToUpdate.length > 0) {
            const updateThreadPromises = threadsToUpdate.map((thread) => {
              return tx.update("threads", thread.id, async (t) => {
                t.modelId = "";
              });
            });
            await Promise.all(updateThreadPromises);
          }
        }

        if (modelsToAdd.length > 0) {
          const addPromises = modelsToAdd.map((model) => {
            return tx.insert("models", model);
          });
          await Promise.all(addPromises);
        }
      });
    }
  }

  private async reorderProviders() {
    const query = triplitClient.query("providers").Order("order", "ASC");
    const providers = await triplitClient.fetch(query);

    const updatePromises = providers.map((provider, index) => {
      return triplitClient.update(
        "providers",
        provider.id,
        async (provider) => {
          provider.order = index;
        },
      );
    });

    await Promise.all(updatePromises);
  }

  private async getProviderById(providerId: string): Promise<Provider | null> {
    const provider = await triplitClient.fetchById("providers", providerId);
    return provider || null;
  }
}

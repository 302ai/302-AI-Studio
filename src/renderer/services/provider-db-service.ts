import { triplitClient } from "@shared/triplit/client";
import type { CreateModelData, CreateProviderData, Provider, UpdateProviderData } from "@shared/triplit/types";

export async function insertProvider(provider: CreateProviderData) {
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

export async function deleteProvider(providerId: string) {
  await triplitClient.delete("providers", providerId);
  await reorderProviders();
}

export async function updateProvider(providerId: string, provider: UpdateProviderData) {
  await triplitClient.update("providers", providerId, provider);
  await reorderProviders();
}

export async function getProviders(): Promise<Provider[]> {
  const query = triplitClient.query("providers")
  const providers = await triplitClient.fetch(query);
  return providers;
}

export async function insertModels(models: CreateModelData[]) {
  const addModels = models.map((model) => {
    return triplitClient.insert("models", model);
  });

  await Promise.all(addModels);
}

export async function deleteModelsByProviderId(providerId: string) {
  const query = triplitClient
    .query("models")
    .Where("providerId", "=", providerId);
  const models = await triplitClient.fetch(query);
  const deleteModels = models.map((model) => {
    return triplitClient.delete("models", model.id);
  });
  await Promise.all(deleteModels);
}

async function reorderProviders() {
  const query = triplitClient.query("providers").Order("order", "ASC");
  const providers = await triplitClient.fetch(query);

  const updatePromises = providers.map((provider, index) => {
    return triplitClient.update("providers", provider.id, {
      order: index,
    });
  });

  await Promise.all(updatePromises);
}

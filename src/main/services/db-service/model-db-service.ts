import { triplitClient } from "@main/triplit/client";
import type { CreateModelData, UpdateModelData } from "@shared/triplit/types";
import type { Model } from "@shared/types/model";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";

@injectable()
export class ModelDbService extends BaseDbService {
  constructor() {
    super("models");
  }

  async insertModel(
    providerId: string,
    model: CreateModelData,
  ): Promise<Model> {
    return await triplitClient.insert("models", {
      ...model,
      providerId: providerId,
    });
  }

  async updateModel(
    modelId: string,
    updateData: UpdateModelData,
  ): Promise<void> {
    await triplitClient.update("models", modelId, async (model) => {
      Object.assign(model, updateData);
    });
  }

  async deleteModel(modelId: string): Promise<void> {
    await triplitClient.delete("models", modelId);
  }

  async getModelById(modelId: string): Promise<Model | null> {
    return await triplitClient.fetchById("models", modelId);
  }
}

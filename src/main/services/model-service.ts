import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "@main/shared/reflect";
import { TYPES } from "@main/shared/types";
import logger from "@shared/logger/main-logger";
import type { CreateModelData, UpdateModelData } from "@shared/triplit/types";
import type { Model } from "@shared/types/model";
import { inject, injectable } from "inversify";
import type { ModelDbService } from "./db-service/model-db-service";

@injectable()
@ServiceRegister(TYPES.ModelService)
export class ModelService {
  constructor(
    @inject(TYPES.ModelDbService) private modelDbService: ModelDbService,
  ) {}

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async insertModel(
    _event: Electron.IpcMainEvent,
    providerId: string,
    model: CreateModelData,
  ): Promise<Model> {
    try {
      const newModel = await this.modelDbService.insertModel(providerId, model);
      return newModel;
    } catch (error) {
      logger.error("ModelService: insertModel error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async updateModel(
    _event: Electron.IpcMainEvent,
    modelId: string,
    updateData: UpdateModelData,
  ): Promise<void> {
    try {
      await this.modelDbService.updateModel(modelId, updateData);
    } catch (error) {
      logger.error("ModelService: updateModel error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async deleteModel(
    _event: Electron.IpcMainEvent,
    modelId: string,
  ): Promise<void> {
    try {
      await this.modelDbService.deleteModel(modelId);
    } catch (error) {
      logger.error("ModelService: deleteModel error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async clearModel(
    _event: Electron.IpcMainEvent,
    providerId: string,
  ): Promise<void> {
    try {
      await this.modelDbService.clearModel(providerId);
    } catch (error) {
      logger.error("ModelService: clearModel error", { error });
      throw error;
    }
  }

  // 收藏
  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__ONE_WAY)
  async collectModel(
    _event: Electron.IpcMainEvent,
    modelId: string,
    collected: boolean,
  ): Promise<void> {
    try {
      await this.modelDbService.updateModel(modelId, {
        collected,
      });
    } catch (error) {
      logger.error("ModelService: collectModel error", { error });
      throw error;
    }
  }

  async _getModelById(modelId: string): Promise<Model | null> {
    try {
      return await this.modelDbService.getModelById(modelId);
    } catch (error) {
      logger.error("ModelService: getModelById error", { error });
      return null;
    }
  }
}

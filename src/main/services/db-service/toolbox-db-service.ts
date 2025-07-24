import { triplitClient } from "@main/triplit/client";
import logger from "@shared/logger/main-logger";
import type { CreateToolData, UpdateToolData } from "@shared/triplit/types";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";

@injectable()
export class ToolboxDbService extends BaseDbService {
  constructor() {
    super("toolbox");
  }

  async insertTools(tools: CreateToolData[]) {
    try {
      // * Delete all tools
      await this.clearToolbox();

      await triplitClient.transact(async (tx) => {
        const insertPromises = tools.map((tool) => tx.insert("toolbox", tool));
        await Promise.all(insertPromises);
      });
    } catch (error) {
      logger.error("ToolboxDbService:insertTools error", { error });
      throw error;
    }
  }

  async clearToolbox() {
    try {
      const query = triplitClient.query("toolbox");
      const tools = await triplitClient.fetch(query);
      await triplitClient.transact(async (tx) => {
        const deletePromises = tools.map((tool) =>
          tx.delete("toolbox", tool.id),
        );
        await Promise.all(deletePromises);
      });
    } catch (error) {
      logger.error("ToolboxDbService:clearToolbox error", { error });
      throw error;
    }
  }

  async getToolByToolId(toolId: number) {
    try {
      const query = triplitClient.query("toolbox").Where("toolId", "=", toolId);
      const tool = await triplitClient.fetchOne(query);
      return tool;
    } catch (error) {
      logger.error("ToolboxDbService:getToolByToolId error", { error });
      throw error;
    }
  }

  async getAllTools() {
    try {
      const query = triplitClient.query("toolbox");
      const tools = await triplitClient.fetch(query);
      return tools;
    } catch (error) {
      logger.error("ToolboxDbService:getAllTools error", { error });
      throw error;
    }
  }

  async updateTool(id: string, updateData: UpdateToolData) {
    try {
      await triplitClient.update("toolbox", id, async (tool) => {
        Object.assign(tool, updateData);
      });
    } catch (error) {
      logger.error("ToolboxDbService:updateTool error", { error });
      throw error;
    }
  }
}

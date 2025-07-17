import { triplitClient } from "@main/triplit/client";
import logger from "@shared/logger/main-logger";
import type { CreateToolboxData } from "@shared/triplit/types";
import { injectable } from "inversify";
import { BaseDbService } from "./base-db-service";

@injectable()
export class ToolboxDbService extends BaseDbService {
  constructor() {
    super("toolbox");
  }

  async insertTools(tools: CreateToolboxData[]) {
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
}

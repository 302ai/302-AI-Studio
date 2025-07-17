import { fetch302AIToolList } from "@main/api/302ai";
import { TYPES } from "@main/shared/types";
import logger from "@shared/logger/main-logger";
import type { CreateToolboxData } from "@shared/triplit/types";
import { inject, injectable } from "inversify";
import { ServiceRegister } from "../shared/reflect";
import type { ToolboxDbService } from "./db-service/toolbox-db-service";
import type { SettingsService } from "./settings-service";

@ServiceRegister(TYPES.ToolboxService)
@injectable()
export class ToolboxService {
  constructor(
    @inject(TYPES.ToolboxDbService) private toolboxDbService: ToolboxDbService,
    @inject(TYPES.SettingsService) private settingsService: SettingsService,
  ) {
    this.initToolboxService();
  }

  private async initToolboxService() {
    try {
      const lang = await this.settingsService.getLanguage();
      const toolList = await fetch302AIToolList(lang);
      const tools: CreateToolboxData[] = toolList.data
        .filter((tool) => tool.enable && ![9].includes(tool.tool_id)) // * Excluding AI Omni Toolbox(id:9)
        .reduce((acc: CreateToolboxData[], tool) => {
          const { tool_name, tool_description, category_name, category_id } =
            tool;
          acc.push({
            name: tool_name,
            description: tool_description,
            category: category_name,
            categoryId: category_id,
            collected: false,
          });
          return acc;
        }, []);
      await this.toolboxDbService.insertTools(tools);
    } catch (error) {
      logger.error("ToolboxService:initToolboxService error", { error });
      throw error;
    }
  }
}

import { fetch302AIToolList } from "@main/api/302ai";
import { TYPES } from "@main/shared/types";
import logger from "@shared/logger/main-logger";
import type { CreateToolData, Language } from "@shared/triplit/types";
import { inject, injectable } from "inversify";
import { ServiceRegister } from "../shared/reflect";
import type { ToolboxDbService } from "./db-service/toolbox-db-service";
import { EventNames, emitter } from "./event-service";
import type { SettingsService } from "./settings-service";

@ServiceRegister(TYPES.ToolboxService)
@injectable()
export class ToolboxService {
  private apiKey: string | null = null;
  private toolDetailMap: Map<number, string> = new Map();

  constructor(
    @inject(TYPES.ToolboxDbService) private toolboxDbService: ToolboxDbService,
    @inject(TYPES.SettingsService) private settingsService: SettingsService,
  ) {
    this.initToolboxService();

    emitter.on(EventNames.SETTINGS_LANGUAGE_UPDATE, async ({ language }) => {
      await this.updateToolList(language);
    });
  }

  private async initToolboxService() {
    try {
      const lang = await this.settingsService.getLanguage();
      await this.updateToolList(lang);
    } catch (error) {
      logger.error("ToolboxService:initToolboxService error", { error });
      throw error;
    }
  }

  private async updateToolList(lang: Language) {
    try {
      const toolList = await fetch302AIToolList(lang);
      const tools: CreateToolData[] = toolList.data
        .filter((tool) => tool.enable && ![9].includes(tool.tool_id)) // * Excluding AI Omni Toolbox(id:9)
        .reduce((acc: CreateToolData[], tool) => {
          const {
            tool_id,
            tool_name,
            tool_description,
            category_name,
            category_id,
          } = tool;
          acc.push({
            toolId: tool_id,
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
      logger.error("ToolboxService:updateToolList error", { error });
      throw error;
    }
  }

  async getToolUrl(toolId: number) {
    if (!this.apiKey) {
      throw new Error("ToolboxService:getToolUrl error: apiKey is not set");
    }

    return this.toolDetailMap.get(toolId);
  }
}

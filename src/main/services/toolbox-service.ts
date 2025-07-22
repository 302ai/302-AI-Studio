import {
  fetch302AIToolDetail,
  fetch302AIToolList,
  fetch302AIUserInfo,
} from "@main/api/302ai";
import { TYPES } from "@main/shared/types";
import { numberToBase64 } from "@main/utils/utils";
import logger from "@shared/logger/main-logger";
import type { CreateToolData, Language } from "@shared/triplit/types";
import { inject, injectable } from "inversify";
import {
  CommunicationWay,
  ServiceHandler,
  ServiceRegister,
} from "../shared/reflect";
import type { ConfigService } from "./config-service";
import type { ToolboxDbService } from "./db-service/toolbox-db-service";
import { EventNames, emitter } from "./event-service";
import type { SettingsService } from "./settings-service";

@ServiceRegister(TYPES.ToolboxService)
@injectable()
export class ToolboxService {
  private toolDetailMap: Map<string, string> = new Map();

  constructor(
    @inject(TYPES.ToolboxDbService) private toolboxDbService: ToolboxDbService,
    @inject(TYPES.SettingsService) private settingsService: SettingsService,
    @inject(TYPES.ConfigService) private configService: ConfigService,
  ) {
    this.initToolboxService();
    this.setupEventListeners();
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

  private setupEventListeners() {
    emitter.on(EventNames.SETTINGS_LANGUAGE_UPDATE, async ({ language }) => {
      await this.updateToolList(language);
    });
    emitter.on(EventNames.PROVIDER_UPDATE, async ({ updateData }) => {
      if (updateData.apiType === "302ai") {
        const lang = await this.settingsService.getLanguage();
        await this.updateToolList(lang);
      }
    });
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

      this.toolDetailMap.clear();

      const _302AIProvider = await this.configService.get302AIProvider();
      if (_302AIProvider.status !== "success") return;

      const userInfo = await fetch302AIUserInfo(_302AIProvider.apiKey);
      const uidBase64 = numberToBase64(userInfo.data.uid);
      const toolDetail = await fetch302AIToolDetail(uidBase64);
      for (const tool of tools) {
        const detail = toolDetail.data.app_box_detail[`${tool.toolId}`];
        if (detail) {
          this.toolDetailMap.set(`${tool.toolId}`, detail.url);
        }
      }
    } catch (error) {
      logger.error("ToolboxService:updateToolList error", { error });
      throw error;
    }
  }

  @ServiceHandler(CommunicationWay.RENDERER_TO_MAIN__TWO_WAY)
  async getToolUrl(
    _event: Electron.IpcMainEvent,
    toolId: number,
  ): Promise<{
    isOk: boolean;
    url: string;
    errorMsg: string | null;
  }> {
    const url = this.toolDetailMap.get(`${toolId}`);
    if (!url) {
      return {
        isOk: false,
        url: "",
        errorMsg: `Tool with ID ${toolId} not found`,
      };
    }
    return {
      isOk: true,
      url,
      errorMsg: null,
    };
  }
}

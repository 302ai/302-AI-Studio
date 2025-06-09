/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import type { CreateModelData, Provider } from "@shared/triplit/types";
import { BrowserWindow } from "electron";
import Logger from "electron-log";

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  attachments?: string | null;
}

export interface StreamChatParams {
  tabId: string;
  threadId: string;
  userMessageId: string;
  messages: ChatMessage[];
  modelName: string;
}

export abstract class BaseProviderService {
  protected provider: Provider;
  protected models: CreateModelData[] = [];

  constructor(provider: Provider) {
    this.provider = provider;
  }

  abstract checkApiKey(): Promise<{
    isOk: boolean;
    errorMsg: string | null;
  }>;

  async fetchModels(): Promise<CreateModelData[]> {
    try {
      const models = await this.fetchProviderModels();
      this.models = models;
      Logger.debug(
        "Fetch models successfully:",
        this.provider.name,
        "model count:",
        models.length,
      );

      return models;
    } catch (error) {
      Logger.error("Failed to fetch models:", error);
      if (!this.models) {
        this.models = [];
      }
      return [];
    }
  }

  protected abstract fetchProviderModels(): Promise<CreateModelData[]>;

  // Abstract method for streaming chat - to be implemented by each provider
  abstract startStreamChat(
    params: StreamChatParams,
  ): Promise<{ success: boolean; error?: string }>;

  // Abstract method for regenerating streaming chat - to be implemented by each provider
  abstract reGenerateStreamChat(
    params: StreamChatParams,
    regenerateMessageId: string,
  ): Promise<{ success: boolean; error?: string }>;

  // Helper method to send IPC events to all windows
  protected sendToAllWindows(channel: string, data: any) {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(channel, data);
    });
  }
}

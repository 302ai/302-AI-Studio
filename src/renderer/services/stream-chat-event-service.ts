/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import {
  getMessagesByThreadId,
  insertMessage,
  updateMessage,
} from "@renderer/services/db-services/messages-db-service";
import Logger from "electron-log";
import { toast } from "sonner";

export interface StreamChatEvent {
  tabId: string;
  threadId: string;
  userMessageId: string;
  delta?: string;
  fullContent?: string;
  usage?: any;
  error?: string;
  regenerateMessageId?: string;
}

export interface StreamingMessage {
  id: string;
  threadId: string;
  parentMessageId: string;
  role: "assistant";
  content: string;
  status: "pending" | "success" | "error";
  orderSeq: number;
}

type StreamEventCallback = (event: StreamChatEvent) => void;

class StreamChatEventService {
  private initialized = false;
  private streamingMessages = new Map<string, StreamingMessage>();
  private isStreaming = false;
  private activeTabId: string | null = null;

  // Event callbacks
  private onStreamStartCallbacks: StreamEventCallback[] = [];
  private onStreamDeltaCallbacks: StreamEventCallback[] = [];
  private onStreamEndCallbacks: StreamEventCallback[] = [];
  private onStreamErrorCallbacks: StreamEventCallback[] = [];
  private onStreamingStateChangeCallbacks: ((isStreaming: boolean) => void)[] =
    [];
  private onStreamingMessagesChangeCallbacks: ((
    messages: StreamingMessage[],
  ) => void)[] = [];

  constructor() {
    this.initializeIpcListeners();
  }

  private initializeIpcListeners() {
    if (this.initialized) return;

    const handleStreamStart = async (_event: any, data: StreamChatEvent) => {
      Logger.info("Stream started:", data);

      // Only handle events for current tab
      if (this.activeTabId !== data.tabId) return;

      this.setIsStreaming(true);

      // Get current messages to determine correct orderSeq
      const existingMessages = await getMessagesByThreadId(data.threadId);
      const nextOrderSeq = existingMessages.length + 1;

      // Create a temporary streaming message
      const tempMessage: StreamingMessage = {
        id: `temp-${data.userMessageId}`,
        threadId: data.threadId,
        parentMessageId: data.userMessageId,
        role: "assistant",
        content: "",
        status: "pending",
        orderSeq: nextOrderSeq,
      };

      this.streamingMessages.set(tempMessage.id, tempMessage);
      this.notifyStreamingMessagesChange();

      // Notify callbacks
      this.onStreamStartCallbacks.forEach((callback) => callback(data));
    };

    const handleStreamDelta = (_event: any, data: StreamChatEvent) => {
      // Only handle events for current tab
      if (this.activeTabId !== data.tabId) return;

      const tempId = `temp-${data.userMessageId}`;
      const existing = this.streamingMessages.get(tempId);
      if (existing && data.fullContent !== undefined) {
        existing.content = data.fullContent;
        this.streamingMessages.set(tempId, { ...existing });
        this.notifyStreamingMessagesChange();
      }

      // Notify callbacks
      this.onStreamDeltaCallbacks.forEach((callback) => callback(data));
    };

    const handleStreamEnd = async (_event: any, data: StreamChatEvent) => {
      Logger.info("Stream ended:", data);

      // Only handle events for current tab
      if (this.activeTabId !== data.tabId) return;

      this.setIsStreaming(false);

      const tempId = `temp-${data.userMessageId}`;

      try {
        // Save the complete message to database
        if (data.fullContent) {
          // Get the current message count for orderSeq
          const existingMessages = await getMessagesByThreadId(data.threadId);
          const nextOrderSeq = (existingMessages?.length || 0) + 1;

          const savedMessage = await insertMessage({
            threadId: data.threadId,
            parentMessageId: data.userMessageId,
            role: "assistant",
            content: data.fullContent,
            attachments: null,
            orderSeq: nextOrderSeq,
            tokenCount: data.usage?.totalTokens || data.fullContent.length,
            status: "success",
          });

          Logger.info("Assistant message saved to DB:", savedMessage);
        }
      } catch (error) {
        Logger.error("Failed to save assistant message:", error);
        toast.error("Failed to save assistant message");
      }

      // Remove temporary message
      this.streamingMessages.delete(tempId);
      this.notifyStreamingMessagesChange();

      // Notify callbacks
      this.onStreamEndCallbacks.forEach((callback) => callback(data));
    };

    const handleStreamError = async (_event: any, data: StreamChatEvent) => {
      Logger.error("Stream error:", data);

      // Only handle events for current tab
      if (this.activeTabId !== data.tabId) return;

      this.setIsStreaming(false);
      toast.error(`Chat error: ${data.error}`);

      const tempId = `temp-${data.userMessageId}`;

      try {
        // Save error message to database
        const existingMessages = await getMessagesByThreadId(data.threadId);
        const nextOrderSeq = existingMessages.length + 1;

        await insertMessage({
          threadId: data.threadId,
          parentMessageId: data.userMessageId,
          role: "assistant",
          content:
            "Sorry, I encountered an error while processing your request. Please try again.",
          attachments: null,
          orderSeq: nextOrderSeq,
          tokenCount: 0,
          status: "error",
        });

        Logger.info("Error message saved to DB");
      } catch (error) {
        Logger.error("Failed to save error message:", error);
      }

      // Remove temporary message
      this.streamingMessages.delete(tempId);
      this.notifyStreamingMessagesChange();

      // Notify callbacks
      this.onStreamErrorCallbacks.forEach((callback) => callback(data));
    };

    // Regenerate event handlers
    const handleRegenerateStreamStart = async (
      _event: any,
      data: StreamChatEvent,
    ) => {
      Logger.info("Regenerate stream started:", data);

      // Only handle events for current tab
      if (this.activeTabId !== data.tabId) return;

      this.setIsStreaming(true);

      // Get current messages to determine correct orderSeq for the regenerating message
      const existingMessages = await getMessagesByThreadId(data.threadId);
      const originalMessage = existingMessages.find(msg => msg.id === data.regenerateMessageId);
      const orderSeq = originalMessage?.orderSeq || existingMessages.length + 1;

      // Create a temporary streaming message for regeneration
      const tempMessage: StreamingMessage = {
        id: `temp-regenerate-${data.regenerateMessageId}`,
        threadId: data.threadId,
        parentMessageId: data.userMessageId,
        role: "assistant",
        content: "",
        status: "pending",
        orderSeq: orderSeq,
      };

      this.streamingMessages.set(tempMessage.id, tempMessage);
      this.notifyStreamingMessagesChange();

      // Notify callbacks
      this.onStreamStartCallbacks.forEach((callback) => callback(data));
    };

    const handleRegenerateStreamDelta = (
      _event: any,
      data: StreamChatEvent,
    ) => {
      // Only handle events for current tab
      if (this.activeTabId !== data.tabId) return;

      const tempId = `temp-regenerate-${data.regenerateMessageId}`;
      const existing = this.streamingMessages.get(tempId);

      Logger.info("Regenerate delta received:", {
        tempId,
        hasExisting: !!existing,
        deltaLength: data.delta?.length || 0,
        fullContentLength: data.fullContent?.length || 0,
        regenerateMessageId: data.regenerateMessageId
      });

      if (existing && data.fullContent !== undefined) {
        existing.content = data.fullContent;
        this.streamingMessages.set(tempId, { ...existing });
        this.notifyStreamingMessagesChange();

        Logger.info("Updated streaming message content:", {
          tempId,
          contentLength: existing.content.length
        });
      }

      // Notify callbacks
      this.onStreamDeltaCallbacks.forEach((callback) => callback(data));
    };

    const handleRegenerateStreamEnd = async (
      _event: any,
      data: StreamChatEvent,
    ) => {
      Logger.info("Regenerate stream ended:", data);

      // Only handle events for current tab
      if (this.activeTabId !== data.tabId) return;

      this.setIsStreaming(false);

      const tempId = `temp-regenerate-${data.regenerateMessageId}`;

      try {
        if (data.fullContent && data.regenerateMessageId) {
          // Update the existing message instead of creating a new one
          await updateMessage(data.regenerateMessageId, (message) => {
            message.content = data.fullContent || "";
            message.status = "success";
            message.tokenCount = data.usage?.totalTokens || (data.fullContent?.length || 0);
            message.createdAt = new Date(); // Update the timestamp to current time
          });

          Logger.info("Regenerated message updated in DB");
        }
      } catch (error) {
        Logger.error("Failed to update regenerated message:", error);
      }

      // Remove temporary message
      this.streamingMessages.delete(tempId);
      this.notifyStreamingMessagesChange();

      // Notify callbacks
      this.onStreamEndCallbacks.forEach((callback) => callback(data));
    };

    const handleRegenerateStreamError = async (
      _event: any,
      data: StreamChatEvent,
    ) => {
      Logger.error("Regenerate stream error:", data);

      // Only handle events for current tab
      if (this.activeTabId !== data.tabId) return;

      this.setIsStreaming(false);
      toast.error(`Regenerate error: ${data.error}`);

      const tempId = `temp-regenerate-${data.regenerateMessageId}`;

      // Remove temporary message
      this.streamingMessages.delete(tempId);
      this.notifyStreamingMessagesChange();

      // Notify callbacks
      this.onStreamErrorCallbacks.forEach((callback) => callback(data));
    };

    // Setup IPC listeners (only once globally)
    window.electron.ipcRenderer.on("chat:stream-start", handleStreamStart);
    window.electron.ipcRenderer.on("chat:stream-delta", handleStreamDelta);
    window.electron.ipcRenderer.on("chat:stream-end", handleStreamEnd);
    window.electron.ipcRenderer.on("chat:stream-error", handleStreamError);

    // Setup regenerate IPC listeners
    window.electron.ipcRenderer.on(
      "chat:regenerate-stream-start",
      handleRegenerateStreamStart,
    );
    window.electron.ipcRenderer.on(
      "chat:regenerate-stream-delta",
      handleRegenerateStreamDelta,
    );
    window.electron.ipcRenderer.on(
      "chat:regenerate-stream-end",
      handleRegenerateStreamEnd,
    );
    window.electron.ipcRenderer.on(
      "chat:regenerate-stream-error",
      handleRegenerateStreamError,
    );

    this.initialized = true;
    Logger.info("Stream chat event service initialized");
  }

  setActiveTab(tabId: string | null) {
    this.activeTabId = tabId;
  }

  private setIsStreaming(isStreaming: boolean) {
    this.isStreaming = isStreaming;
    this.onStreamingStateChangeCallbacks.forEach((callback) =>
      callback(isStreaming),
    );
  }

  private notifyStreamingMessagesChange() {
    const messages = Array.from(this.streamingMessages.values());
    this.onStreamingMessagesChangeCallbacks.forEach((callback) =>
      callback(messages),
    );
  }

  // Public API for components to subscribe to events
  getStreamingMessages(): StreamingMessage[] {
    return Array.from(this.streamingMessages.values());
  }

  getIsStreaming(): boolean {
    return this.isStreaming;
  }

  onStreamingStateChange(callback: (isStreaming: boolean) => void) {
    this.onStreamingStateChangeCallbacks.push(callback);
    return () => {
      const index = this.onStreamingStateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onStreamingStateChangeCallbacks.splice(index, 1);
      }
    };
  }

  onStreamingMessagesChange(callback: (messages: StreamingMessage[]) => void) {
    this.onStreamingMessagesChangeCallbacks.push(callback);
    return () => {
      const index = this.onStreamingMessagesChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onStreamingMessagesChangeCallbacks.splice(index, 1);
      }
    };
  }

  onStreamStart(callback: StreamEventCallback) {
    this.onStreamStartCallbacks.push(callback);
    return () => {
      const index = this.onStreamStartCallbacks.indexOf(callback);
      if (index > -1) {
        this.onStreamStartCallbacks.splice(index, 1);
      }
    };
  }

  onStreamDelta(callback: StreamEventCallback) {
    this.onStreamDeltaCallbacks.push(callback);
    return () => {
      const index = this.onStreamDeltaCallbacks.indexOf(callback);
      if (index > -1) {
        this.onStreamDeltaCallbacks.splice(index, 1);
      }
    };
  }

  onStreamEnd(callback: StreamEventCallback) {
    this.onStreamEndCallbacks.push(callback);
    return () => {
      const index = this.onStreamEndCallbacks.indexOf(callback);
      if (index > -1) {
        this.onStreamEndCallbacks.splice(index, 1);
      }
    };
  }

  onStreamError(callback: StreamEventCallback) {
    this.onStreamErrorCallbacks.push(callback);
    return () => {
      const index = this.onStreamErrorCallbacks.indexOf(callback);
      if (index > -1) {
        this.onStreamErrorCallbacks.splice(index, 1);
      }
    };
  }

  cleanup() {
    if (this.initialized) {
      window.electron.ipcRenderer.removeAllListeners("chat:stream-start");
      window.electron.ipcRenderer.removeAllListeners("chat:stream-delta");
      window.electron.ipcRenderer.removeAllListeners("chat:stream-end");
      window.electron.ipcRenderer.removeAllListeners("chat:stream-error");
      this.initialized = false;
    }
  }
}

// Create and export singleton instance
export const streamChatEventService = new StreamChatEventService();

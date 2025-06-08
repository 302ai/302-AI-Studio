/** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
import { getMessagesByThreadId, insertMessage } from "@renderer/services/db-services/messages-db-service";
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
  private onStreamingStateChangeCallbacks: ((isStreaming: boolean) => void)[] = [];
  private onStreamingMessagesChangeCallbacks: ((messages: StreamingMessage[]) => void)[] = [];

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
      this.onStreamStartCallbacks.forEach(callback => callback(data));
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
      this.onStreamDeltaCallbacks.forEach(callback => callback(data));
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
      this.onStreamEndCallbacks.forEach(callback => callback(data));
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
          content: "Sorry, I encountered an error while processing your request. Please try again.",
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
      this.onStreamErrorCallbacks.forEach(callback => callback(data));
    };

    // Setup IPC listeners (only once globally)
    window.electron.ipcRenderer.on("chat:stream-start", handleStreamStart);
    window.electron.ipcRenderer.on("chat:stream-delta", handleStreamDelta);
    window.electron.ipcRenderer.on("chat:stream-end", handleStreamEnd);
    window.electron.ipcRenderer.on("chat:stream-error", handleStreamError);

    this.initialized = true;
    Logger.info("Stream chat event service initialized");
  }

  setActiveTab(tabId: string | null) {
    this.activeTabId = tabId;
  }

  private setIsStreaming(isStreaming: boolean) {
    this.isStreaming = isStreaming;
    this.onStreamingStateChangeCallbacks.forEach(callback => callback(isStreaming));
  }

  private notifyStreamingMessagesChange() {
    const messages = Array.from(this.streamingMessages.values());
    this.onStreamingMessagesChangeCallbacks.forEach(callback => callback(messages));
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

// ! deprecated
// /** biome-ignore-all lint/suspicious/noExplicitAny: ignore all */
// import Logger from "electron-log";
// import { toast } from "sonner";

// export interface StreamChatEvent {
//   tabId: string;
//   threadId: string;
//   userMessageId: string;
//   delta?: string;
//   fullContent?: string;
//   usage?: any;
//   error?: string;
//   regenerateMessageId?: string;
//   providerId?: string;
// }

// export interface StreamingMessage {
//   id: string;
//   threadId: string;
//   parentMessageId: string;
//   role: "assistant";
//   content: string;
//   status: "pending" | "success" | "error" | "stop";
//   orderSeq: number;
// }

// type StreamEventCallback = (event: StreamChatEvent) => void;

// const { uiService, messageService, fileService } = window.service;

// /**
//  * Parse file attachments and update user message with parsed content
//  */
// async function parseAndUpdateAttachments(userMessageId: string): Promise<void> {
//   try {
//     // Get the user message
//     const userMessage = await messageService.getMessageById(userMessageId);

//     if (!userMessage || !userMessage.attachments) {
//       return;
//     }

//     // Parse attachments JSON
//     let attachments: Array<{
//       id: string;
//       name: string;
//       size: number;
//       type: string;
//       preview?: string;
//       fileData?: string;
//       fileContent?: string;
//     }> = [];

//     try {
//       attachments = JSON.parse(userMessage.attachments);
//     } catch (error) {
//       Logger.warn("Failed to parse attachments JSON:", error);
//       return;
//     }

//     // Check if any attachments need parsing
//     const needsParsing = attachments.some(
//       (att) =>
//         !att.fileContent &&
//         att.fileData &&
//         fileService.shouldParseFile(att.type),
//     );

//     if (!needsParsing) {
//       return;
//     }

//     // Get active provider for parsing
//     const activeProvider = await uiService.getActiveProvider();

//     if (!activeProvider || !activeProvider.apiKey || !activeProvider.baseUrl) {
//       Logger.warn("No active provider available for file parsing");
//       return;
//     }

//     // Parse each attachment that needs parsing
//     let hasUpdates = false;
//     for (const attachment of attachments) {
//       if (
//         !attachment.fileContent &&
//         attachment.fileData &&
//         fileService.shouldParseFile(attachment.type)
//       ) {
//         try {
//           const fileContent = await fileService.parseFileContent(
//             {
//               id: attachment.id,
//               name: attachment.name,
//               type: attachment.type,
//               fileData: attachment.fileData,
//             },
//             {
//               apiKey: activeProvider.apiKey,
//               baseUrl: activeProvider.baseUrl,
//             },
//           );

//           attachment.fileContent = fileContent;
//           hasUpdates = true;

//           Logger.info(
//             `Successfully parsed file content for ${attachment.name}`,
//           );
//         } catch (error) {
//           Logger.error("Failed to parse file content:", error);
//           // Continue with other attachments
//         }
//       }
//     }

//     // Update the message with parsed content if there were updates
//     if (hasUpdates) {
//       await messageService.updateMessage(userMessageId, {
//         attachments: JSON.stringify(attachments),
//       });

//       Logger.info("Successfully updated user message with parsed file content");
//     }
//   } catch (error) {
//     Logger.error("Failed to parse and update attachments:", error);
//   }
// }

// class StreamChatEventService {
//   private initialized = false;
//   private streamingMessages = new Map<string, StreamingMessage>();
//   private isStreaming = false;

//   // Event callbacks
//   private onStreamStartCallbacks: StreamEventCallback[] = [];
//   private onStreamDeltaCallbacks: StreamEventCallback[] = [];
//   private onStreamEndCallbacks: StreamEventCallback[] = [];
//   private onStreamErrorCallbacks: StreamEventCallback[] = [];
//   private onStreamingStateChangeCallbacks: ((isStreaming: boolean) => void)[] =
//     [];
//   private onStreamingMessagesChangeCallbacks: ((
//     messages: StreamingMessage[],
//   ) => void)[] = [];

//   constructor() {
//     this.initializeIpcListeners();
//   }

//   private initializeIpcListeners() {
//     if (this.initialized) return;

//     const handleStreamStart = async (_event: any, data: StreamChatEvent) => {
//       Logger.info("Stream started:", data);

//       // Only handle events for current tab

//       this.setIsStreaming(true);

//       // Get current messages to determine correct orderSeq
//       const existingMessages = await messageService.getMessagesByThreadId(
//         data.threadId,
//       );
//       const nextOrderSeq = existingMessages.length + 1;

//       // Create a temporary streaming message
//       const tempMessage: StreamingMessage = {
//         id: `temp-${data.userMessageId}`,
//         threadId: data.threadId,
//         parentMessageId: data.userMessageId,
//         role: "assistant",
//         content: "",
//         status: "pending",
//         orderSeq: nextOrderSeq,
//       };

//       this.streamingMessages.set(tempMessage.id, tempMessage);
//       this.notifyStreamingMessagesChange();

//       // Notify callbacks
//       this.onStreamStartCallbacks.forEach((callback) => callback(data));
//     };

//     const handleStreamDelta = (_event: any, data: StreamChatEvent) => {
//       // Only handle events for current tab

//       const tempId = `temp-${data.userMessageId}`;
//       const existing = this.streamingMessages.get(tempId);
//       if (existing && data.fullContent !== undefined) {
//         existing.content = data.fullContent;
//         this.streamingMessages.set(tempId, { ...existing });
//         this.notifyStreamingMessagesChange();
//       }

//       // Notify callbacks
//       this.onStreamDeltaCallbacks.forEach((callback) => callback(data));
//     };

//     const handleStreamEnd = async (_event: any, data: StreamChatEvent) => {
//       Logger.info("Stream ended:", data);

//       // Only handle events for current tab

//       this.setIsStreaming(false);

//       const tempId = `temp-${data.userMessageId}`;
//       const tempMessage = this.streamingMessages.get(tempId);

//       try {
//         // First, convert the temporary message to success status to avoid gap
//         if (tempMessage && data.fullContent) {
//           const updatedTempMessage: StreamingMessage = {
//             ...tempMessage,
//             content: data.fullContent,
//             status: "success",
//           };

//           this.streamingMessages.set(tempId, updatedTempMessage);
//           this.notifyStreamingMessagesChange();
//         }

//         // Save the complete message to database
//         if (data.fullContent) {
//           // Get the current message count for orderSeq
//           const existingMessages = await messageService.getMessagesByThreadId(
//             data.threadId,
//           );
//           const nextOrderSeq = (existingMessages?.length || 0) + 1;

//           const savedMessage = await messageService.insertMessage({
//             threadId: data.threadId,
//             parentMessageId: data.userMessageId,
//             role: "assistant",
//             content: data.fullContent,
//             attachments: null,
//             orderSeq: nextOrderSeq,
//             tokenCount: data.usage?.totalTokens || data.fullContent.length,
//             status: "success",
//             providerId: data.providerId,
//           });

//           Logger.info("Assistant message saved to DB:", savedMessage);

//           // Parse file attachments in the user message after successful AI response
//           try {
//             await parseAndUpdateAttachments(data.userMessageId);
//           } catch (error) {
//             Logger.error("Failed to parse file attachments:", error);
//             // Don't show error to user as this is a background operation
//           }
//         }
//       } catch (error) {
//         Logger.error("Failed to save assistant message:", error);
//         toast.error("Failed to save assistant message");
//       }

//       // Delay removing temporary message to allow database query to update
//       setTimeout(() => {
//         this.streamingMessages.delete(tempId);
//         this.notifyStreamingMessagesChange();
//       }, 300); // Increased delay to ensure database query updates

//       // Notify callbacks
//       this.onStreamEndCallbacks.forEach((callback) => callback(data));
//     };

//     const handleStreamError = async (_event: any, data: StreamChatEvent) => {
//       Logger.error("Stream error:", data);

//       // Only handle events for current tab

//       this.setIsStreaming(false);
//       toast.error(`Chat error: ${data.error}`);

//       const tempId = `temp-${data.userMessageId}`;

//       try {
//         // Save error message to database
//         const existingMessages = await messageService.getMessagesByThreadId(
//           data.threadId,
//         );
//         const nextOrderSeq = existingMessages.length + 1;

//         await messageService.insertMessage({
//           threadId: data.threadId,
//           parentMessageId: data.userMessageId,
//           role: "assistant",
//           content:
//             "Sorry, I encountered an error while processing your request. Please try again.",
//           attachments: null,
//           orderSeq: nextOrderSeq,
//           tokenCount: 0,
//           status: "error",
//           providerId: data.providerId,
//         });

//         Logger.info("Error message saved to DB");
//       } catch (error) {
//         Logger.error("Failed to save error message:", error);
//       }

//       // Remove temporary message
//       this.streamingMessages.delete(tempId);
//       this.notifyStreamingMessagesChange();

//       // Notify callbacks
//       this.onStreamErrorCallbacks.forEach((callback) => callback(data));
//     };

//     // Regenerate event handlers
//     const handleRegenerateStreamStart = async (
//       _event: any,
//       data: StreamChatEvent,
//     ) => {
//       Logger.info("Regenerate stream started:", data);

//       // Only handle events for current tab

//       this.setIsStreaming(true);

//       // Get current messages to determine correct orderSeq for the regenerating message
//       const existingMessages = await messageService.getMessagesByThreadId(
//         data.threadId,
//       );
//       const originalMessage = existingMessages.find(
//         (msg) => msg.id === data.regenerateMessageId,
//       );
//       const orderSeq = originalMessage?.orderSeq || existingMessages.length + 1;

//       // Create a temporary streaming message for regeneration
//       const tempMessage: StreamingMessage = {
//         id: `temp-regenerate-${data.regenerateMessageId}`,
//         threadId: data.threadId,
//         parentMessageId: data.userMessageId,
//         role: "assistant",
//         content: "",
//         status: "pending",
//         orderSeq: orderSeq,
//       };

//       this.streamingMessages.set(tempMessage.id, tempMessage);
//       this.notifyStreamingMessagesChange();

//       // Notify callbacks
//       this.onStreamStartCallbacks.forEach((callback) => callback(data));
//     };

//     const handleRegenerateStreamDelta = (
//       _event: any,
//       data: StreamChatEvent,
//     ) => {
//       // Only handle events for current tab

//       const tempId = `temp-regenerate-${data.regenerateMessageId}`;
//       const existing = this.streamingMessages.get(tempId);

//       Logger.info("Regenerate delta received:", {
//         tempId,
//         hasExisting: !!existing,
//         deltaLength: data.delta?.length || 0,
//         fullContentLength: data.fullContent?.length || 0,
//         regenerateMessageId: data.regenerateMessageId,
//       });

//       if (existing && data.fullContent !== undefined) {
//         existing.content = data.fullContent;
//         this.streamingMessages.set(tempId, { ...existing });
//         this.notifyStreamingMessagesChange();

//         Logger.info("Updated streaming message content:", {
//           tempId,
//           contentLength: existing.content.length,
//         });
//       }

//       // Notify callbacks
//       this.onStreamDeltaCallbacks.forEach((callback) => callback(data));
//     };

//     const handleRegenerateStreamEnd = async (
//       _event: any,
//       data: StreamChatEvent,
//     ) => {
//       Logger.info("Regenerate stream ended:", data);

//       // Only handle events for current tab

//       this.setIsStreaming(false);

//       const tempId = `temp-regenerate-${data.regenerateMessageId}`;

//       try {
//         if (data.fullContent && data.regenerateMessageId) {
//           // Update the existing message instead of creating a new one
//           await messageService.updateMessage(data.regenerateMessageId, {
//             content: data.fullContent || "",
//             status: "success",
//             tokenCount:
//               data.usage?.totalTokens || data.fullContent?.length || 0,
//             createdAt: new Date(), // Update the timestamp to current time
//           });

//           Logger.info("Regenerated message updated in DB");
//         }
//       } catch (error) {
//         Logger.error("Failed to update regenerated message:", error);
//       }

//       // Remove temporary message
//       this.streamingMessages.delete(tempId);
//       this.notifyStreamingMessagesChange();

//       // Notify callbacks
//       this.onStreamEndCallbacks.forEach((callback) => callback(data));
//     };

//     const handleRegenerateStreamError = async (
//       _event: any,
//       data: StreamChatEvent,
//     ) => {
//       Logger.error("Regenerate stream error:", data);

//       // Only handle events for current tab

//       this.setIsStreaming(false);
//       toast.error(`Regenerate error: ${data.error}`);

//       const tempId = `temp-regenerate-${data.regenerateMessageId}`;

//       // Remove temporary message
//       this.streamingMessages.delete(tempId);
//       this.notifyStreamingMessagesChange();

//       // Notify callbacks
//       this.onStreamErrorCallbacks.forEach((callback) => callback(data));
//     };

//     const handleStreamStop = async (_event: any, data: StreamChatEvent) => {
//       Logger.info("Stream stop requested:", data);
//       this.setIsStreaming(false);

//       const tempId = `temp-${data.userMessageId}`;
//       const tempMessage = this.streamingMessages.get(tempId);

//       try {
//         // First, convert the temporary message to stop status to avoid gap
//         if (tempMessage && data.fullContent) {
//           const updatedTempMessage: StreamingMessage = {
//             ...tempMessage,
//             content: data.fullContent,
//             status: "stop",
//           };

//           this.streamingMessages.set(tempId, updatedTempMessage);
//           this.notifyStreamingMessagesChange();
//         }

//         // Save the complete message to database
//         if (data.fullContent) {
//           // Get the current message count for orderSeq
//           const existingMessages = await messageService.getMessagesByThreadId(
//             data.threadId,
//           );
//           const nextOrderSeq = (existingMessages?.length || 0) + 1;

//           const savedMessage = await messageService.insertMessage({
//             threadId: data.threadId,
//             parentMessageId: data.userMessageId,
//             role: "assistant",
//             content: data.fullContent,
//             attachments: null,
//             orderSeq: nextOrderSeq,
//             tokenCount: data.fullContent.length,
//             status: "stop",
//             providerId: data.providerId,
//           });

//           Logger.info("Assistant message saved to DB:", savedMessage);

//           // Parse file attachments in the user message after successful AI response
//           try {
//             await parseAndUpdateAttachments(data.userMessageId);
//           } catch (error) {
//             Logger.error("Failed to parse file attachments:", error);
//             // Don't show error to user as this is a background operation
//           }
//         }
//       } catch (error) {
//         Logger.error("Failed to save assistant message:", error);
//         toast.error("Failed to save assistant message");
//       }

//       // Delay removing temporary message to allow database query to update
//       setTimeout(() => {
//         this.streamingMessages.delete(tempId);
//         this.notifyStreamingMessagesChange();
//       }, 300); // Increased delay to ensure database query updates

//       // Notify callbacks
//       this.onStreamEndCallbacks.forEach((callback) => callback(data));
//     };

//     // Handle attachment updates from main process
//     const handleAttachmentsUpdated = async (
//       _event: any,
//       data: { messageId: string; attachments: string },
//     ) => {
//       try {
//         await messageService.updateMessage(data.messageId, {
//           attachments: data.attachments,
//         });

//         Logger.info("Updated message attachments in database");
//       } catch (error) {
//         Logger.error("Failed to update message attachments:", error);
//       }
//     };

//     // Setup IPC listeners (only once globally)
//     window.electron.ipcRenderer.on("chat:stream-start", handleStreamStart);
//     window.electron.ipcRenderer.on("chat:stream-delta", handleStreamDelta);
//     window.electron.ipcRenderer.on("chat:stream-end", handleStreamEnd);
//     window.electron.ipcRenderer.on("chat:stream-error", handleStreamError);
//     window.electron.ipcRenderer.on("chat:stream-stop", handleStreamStop);
//     window.electron.ipcRenderer.on(
//       "chat:attachments-updated",
//       handleAttachmentsUpdated,
//     );

//     // Setup regenerate IPC listeners
//     window.electron.ipcRenderer.on(
//       "chat:regenerate-stream-start",
//       handleRegenerateStreamStart,
//     );
//     window.electron.ipcRenderer.on(
//       "chat:regenerate-stream-delta",
//       handleRegenerateStreamDelta,
//     );
//     window.electron.ipcRenderer.on(
//       "chat:regenerate-stream-end",
//       handleRegenerateStreamEnd,
//     );
//     window.electron.ipcRenderer.on(
//       "chat:regenerate-stream-error",
//       handleRegenerateStreamError,
//     );

//     this.initialized = true;
//     Logger.info("Stream chat event service initialized");
//   }

//   private setIsStreaming(isStreaming: boolean) {
//     this.isStreaming = isStreaming;
//     this.onStreamingStateChangeCallbacks.forEach((callback) =>
//       callback(isStreaming),
//     );
//   }

//   private notifyStreamingMessagesChange() {
//     const messages = Array.from(this.streamingMessages.values());
//     this.onStreamingMessagesChangeCallbacks.forEach((callback) =>
//       callback(messages),
//     );
//   }

//   // Public API for components to subscribe to events
//   getStreamingMessages(): StreamingMessage[] {
//     return Array.from(this.streamingMessages.values());
//   }

//   getIsStreaming(): boolean {
//     return this.isStreaming;
//   }

//   onStreamingStateChange(callback: (isStreaming: boolean) => void) {
//     this.onStreamingStateChangeCallbacks.push(callback);
//     return () => {
//       const index = this.onStreamingStateChangeCallbacks.indexOf(callback);
//       if (index > -1) {
//         this.onStreamingStateChangeCallbacks.splice(index, 1);
//       }
//     };
//   }

//   onStreamingMessagesChange(callback: (messages: StreamingMessage[]) => void) {
//     this.onStreamingMessagesChangeCallbacks.push(callback);
//     return () => {
//       const index = this.onStreamingMessagesChangeCallbacks.indexOf(callback);
//       if (index > -1) {
//         this.onStreamingMessagesChangeCallbacks.splice(index, 1);
//       }
//     };
//   }

//   onStreamStart(callback: StreamEventCallback) {
//     this.onStreamStartCallbacks.push(callback);
//     return () => {
//       const index = this.onStreamStartCallbacks.indexOf(callback);
//       if (index > -1) {
//         this.onStreamStartCallbacks.splice(index, 1);
//       }
//     };
//   }

//   onStreamDelta(callback: StreamEventCallback) {
//     this.onStreamDeltaCallbacks.push(callback);
//     return () => {
//       const index = this.onStreamDeltaCallbacks.indexOf(callback);
//       if (index > -1) {
//         this.onStreamDeltaCallbacks.splice(index, 1);
//       }
//     };
//   }

//   onStreamEnd(callback: StreamEventCallback) {
//     this.onStreamEndCallbacks.push(callback);
//     return () => {
//       const index = this.onStreamEndCallbacks.indexOf(callback);
//       if (index > -1) {
//         this.onStreamEndCallbacks.splice(index, 1);
//       }
//     };
//   }

//   onStreamError(callback: StreamEventCallback) {
//     this.onStreamErrorCallbacks.push(callback);
//     return () => {
//       const index = this.onStreamErrorCallbacks.indexOf(callback);
//       if (index > -1) {
//         this.onStreamErrorCallbacks.splice(index, 1);
//       }
//     };
//   }

//   cleanup() {
//     if (this.initialized) {
//       window.electron.ipcRenderer.removeAllListeners("chat:stream-start");
//       window.electron.ipcRenderer.removeAllListeners("chat:stream-delta");
//       window.electron.ipcRenderer.removeAllListeners("chat:stream-end");
//       window.electron.ipcRenderer.removeAllListeners("chat:stream-error");
//       window.electron.ipcRenderer.removeAllListeners("chat:stream-stop");
//       window.electron.ipcRenderer.removeAllListeners(
//         "chat:attachments-updated",
//       );
//       // Remove regenerate IPC listeners
//       window.electron.ipcRenderer.removeAllListeners(
//         "chat:regenerate-stream-start",
//       );
//       window.electron.ipcRenderer.removeAllListeners(
//         "chat:regenerate-stream-delta",
//       );
//       window.electron.ipcRenderer.removeAllListeners(
//         "chat:regenerate-stream-end",
//       );
//       window.electron.ipcRenderer.removeAllListeners(
//         "chat:regenerate-stream-error",
//       );
//       this.initialized = false;
//     }
//   }
// }

// // Create and export singleton instance
// export const streamChatEventService = new StreamChatEventService();

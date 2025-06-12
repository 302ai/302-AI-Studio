// import { triplitClient } from "@shared/triplit/client";
// import type { CreateMessageData, Message } from "@shared/triplit/types";

// export async function insertMessage(message: CreateMessageData): Promise<Message> {
//   return await triplitClient.insert("messages", message);
// }

// export async function updateMessage(
//   messageId: string,
//   updater: (message: Message) => void | Promise<void>
// ): Promise<void> {
//   await triplitClient.update("messages", messageId, updater);
// }

// export async function deleteMessage(messageId: string): Promise<void> {
//   await triplitClient.delete("messages", messageId);
// }

// export async function getMessagesByThreadId(threadId: string): Promise<Message[]> {
//   const query = triplitClient
//     .query("messages")
//     .Where("threadId", "=", threadId)
//     .Order("createdAt", "ASC");

//   return await triplitClient.fetch(query);
// }

// export async function getMessageById(messageId: string): Promise<Message | null> {
//   try {
//     return await triplitClient.fetchById("messages", messageId);
//   } catch {
//     return null;
//   }
// }

// export async function cleanMessagesByThreadId(threadId: string): Promise<void> {
//   try {
//     const messages = await getMessagesByThreadId(threadId);
//     const deletePromises = messages.map(message =>
//       triplitClient.delete("messages", message.id)
//     );

//     await Promise.all(deletePromises);

//     console.log(`🧹 Successfully cleaned ${messages.length} messages from thread ${threadId}`);
//   } catch (error) {
//     console.error("❌ Failed to clean messages:", error);
//     throw error;
//   }
// }

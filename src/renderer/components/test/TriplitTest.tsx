import { triplitClient } from "@shared/triplit/client";
import type React from "react";
import { useEffect, useState } from "react";

interface TestMessage {
  id: string;
  role: "user" | "assistant" | "system" | "function";
  content: string;
  createdAt: Date;
  threadId: string;
}

export const TriplitTest: React.FC = () => {
  const [messages, setMessages] = useState<TestMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("初始化中...");

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAndTest = async () => {
      try {
        // 测试连接
        setStatus("连接到Triplit服务器...");
        await triplitClient.connect();
        setStatus("✅ 已连接到服务器");

        // 订阅消息变化
        const query = triplitClient.query("messages").Order("createdAt", "ASC");

        unsubscribe = triplitClient.subscribe(
          query,
          (results) => {
            console.log("收到Triplit数据更新:", results);
            const messageList = Array.from(results.values()) as TestMessage[];
            setMessages(messageList);
            setStatus(`✅ 已连接 | 消息数量: ${messageList.length}`);
          },
          (error) => {
            console.error("Triplit订阅错误:", error);
            setStatus(`❌ 订阅错误: ${error.message}`);
          },
        );
      } catch (error) {
        console.error("Triplit初始化错误:", error);
        setStatus(
          `❌ 连接失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    initAndTest();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const message = {
        role: "user" as const,
        content: newMessage,
        threadId: `test-thread-${Date.now()}`,
        createdAt: new Date(),
      };

      await triplitClient.insert("messages", message);
      setNewMessage("");
      setStatus("✅ 消息已发送并同步");
    } catch (error) {
      console.error("发送消息失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearMessages = async () => {
    setLoading(true);
    try {
      // 删除所有消息
      for (const message of messages) {
        await triplitClient.delete("messages", message.id);
      }
      setStatus("✅ 所有消息已清除");
    } catch (error) {
      console.error("清除消息失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestInsert = async () => {
    setLoading(true);
    try {
      // 插入测试数据
      const testMessages = [
        {
          role: "user" as const,
          content: "这是第一条测试消息",
          threadId: "test-thread",
          createdAt: new Date(Date.now() - 2000),
        },
        {
          role: "assistant" as const,
          content: "这是AI的回复消息",
          threadId: "test-thread",
          createdAt: new Date(Date.now() - 1000),
        },
        {
          role: "user" as const,
          content: "这是另一条用户消息",
          threadId: "test-thread",
          createdAt: new Date(),
        },
      ];

      for (const message of testMessages) {
        await triplitClient.insert("messages", message);
      }

      setStatus("✅ 测试数据已插入");
    } catch (error) {
      console.error("插入测试数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <h1 className="mb-4 font-bold text-2xl text-gray-800">
          Triplit 数据库测试
        </h1>

        {/* 状态显示 */}
        <div className="mb-4 rounded-lg bg-gray-100 p-3">
          <p className="font-medium text-sm">状态: {status}</p>
        </div>

        {/* 操作按钮 */}
        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={handleTestInsert}
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "处理中..." : "插入测试数据"}
          </button>
          <button
            type="button"
            onClick={handleClearMessages}
            disabled={loading || messages.length === 0}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
          >
            清除所有消息
          </button>
        </div>

        {/* 发送新消息 */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="输入新消息..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={loading || !newMessage.trim()}
              className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700 text-lg">
            实时消息列表 ({messages.length} 条)
          </h2>

          {messages.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              暂无消息。点击"插入测试数据"或发送新消息来测试功能。
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-lg p-3 ${
                    message.role === "user"
                      ? "border-blue-500 border-l-4 bg-blue-50"
                      : "border-gray-500 border-l-4 bg-gray-50"
                  }`}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <span className="font-medium text-gray-600 text-sm">
                      {message.role === "user" ? "👤 用户" : "🤖 助手"}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-800">{message.content}</p>
                  <p className="mt-1 text-gray-500 text-xs">
                    ID: {message.id} | Thread: {message.threadId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

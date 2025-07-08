import { useEffect, useState } from "react";
import logger from "@shared/logger/renderer-logger";

interface ServerStatus {
  isRunning: boolean;
  config: {
    port: number;
    projectId: string;
    verboseLogs: boolean;
  };
}

export function TriplitStatus() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    try {
      const serverStatus =
        await window.service.triplitService.getServerStatus();
      setStatus(serverStatus);
    } catch (error) {
      logger.error("Failed to get server status", { error });
      setStatus(null);
    }
  };

  const restartServer = async () => {
    setLoading(true);
    try {
      const result = await window.service.triplitService.restartServer();
      logger.debug("Restart result", { result });
      if (result.success) {
        await checkStatus();
      }
    } catch (error) {
      logger.error("Failed to restart server", { error });
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    checkStatus();
  }, []);

  if (!status) {
    return (
      <div className="rounded-lg border bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-700">Triplit Server</h3>
        <p className="text-gray-500">Loading...</p>
        <button
          type="button"
          onClick={checkStatus}
          className="mt-2 rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold text-gray-800">
        Triplit Server Status
      </h3>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Status:</span>
          <span
            className={`font-medium text-sm ${
              status.isRunning ? "text-green-600" : "text-red-600"
            }`}
          >
            {status.isRunning ? "Running" : "Stopped"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Port:</span>
          <span className="font-mono text-sm">{status.config.port}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Project ID:</span>
          <span className="font-mono text-sm">{status.config.projectId}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Verbose Logs:</span>
          <span className="text-sm">
            {status.config.verboseLogs ? "Yes" : "No"}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={checkStatus}
          className="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={restartServer}
          disabled={loading}
          className="rounded bg-orange-500 px-3 py-1 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? "Restarting..." : "Restart"}
        </button>
      </div>
    </div>
  );
}

import logger from "@renderer/config/logger";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const { updaterService } = window.service;
const { ipcRenderer } = window.electron;

enum IpcRendererEvent {
  UPDATER_CHECK_STATUS = "updater:check-status",
  UPDATER_DOWNLOAD_STATUS = "updater:download-status",
}

export type UpdaterStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded";

export function useVersionUpdate() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.general-settings.version-update",
  });

  const [status, setStatus] = useState<UpdaterStatus>("idle");
  const [progress, setProgress] = useState<number>(0);

  const handleChange = async (checked: boolean): Promise<void> => {
    await updaterService.setAutoUpdate(checked);
  };

  const handleActions = async (): Promise<void> => {
    switch (status) {
      case "idle":
        await handleCheckForUpdates();
        break;
      case "available":
        await updaterService.update();
        break;
      case "downloaded":
        await updaterService.install();
        break;
      default:
        break;
    }
  };

  const handleCheckForUpdates = async (): Promise<void> => {
    setStatus("checking");

    try {
      await updaterService.checkForUpdates();
    } catch (error) {
      logger.error("Failed to check for updates:", { error });
      toast.error(t("check-failed"));
      setStatus("idle");
    }
  };

  const handleCheckStatus = useCallback(
    (
      _event: Electron.IpcRendererEvent,
      data: { status: "available" | "not-available"; version: string },
    ) => {
      const isAvailable = data.status === "available";

      setStatus(isAvailable ? "available" : "idle");

      toast.success(
        isAvailable ? t("update-available") : t("no-update-available"),
        {
          description: data.version,
        },
      );
    },
    [t],
  );

  const handleDownloadStatus = useCallback(
    (
      _event: Electron.IpcRendererEvent,
      data: {
        status: "downloading" | "downloaded";
        precent?: number;
      },
    ) => {
      const { status, precent } = data;

      setStatus(status === "downloading" ? "downloading" : "downloaded");

      if (status === "downloading") {
        setProgress(precent ?? 0);
      }

      if (status === "downloaded") {
        toast.success(t("update-downloaded"));
      }
    },
    [t],
  );

  useEffect(() => {
    const checkUpdate = async () => {
      const status = await updaterService.getStatus();
      setStatus(status);
    };

    checkUpdate();
  }, []);

  useEffect(() => {
    ipcRenderer.on(IpcRendererEvent.UPDATER_CHECK_STATUS, handleCheckStatus);
    ipcRenderer.on(
      IpcRendererEvent.UPDATER_DOWNLOAD_STATUS,
      handleDownloadStatus,
    );

    return () => {
      ipcRenderer.removeAllListeners(IpcRendererEvent.UPDATER_CHECK_STATUS);
      ipcRenderer.removeAllListeners(IpcRendererEvent.UPDATER_DOWNLOAD_STATUS);
    };
  }, [handleCheckStatus, handleDownloadStatus]);

  return {
    status,
    progress,
    handleChange,
    handleActions,
  };
}

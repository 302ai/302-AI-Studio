import { Button } from "@renderer/components/ui/button";
import { EventNames, emitter } from "@renderer/services/event-service";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import CodeArtifact from "./code-artifact";
import { HtmlPreview } from "./html-artifact";
import SvgArtifact from "./svg-artifact";

export const ArtifactPreviewPanel = () => {
  const { t } = useTranslation("translation", {
    keyPrefix: "artifacts",
  });
  const titleId = useId();
  const [drawerContent, setDrawerContent] = useState("preview");

  // 内部状态管理
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");

  // 事件监听和操作管理
  useEffect(() => {
    // 监听代码预览打开事件
    const unsubscribeOpen = emitter.on(
      EventNames.CODE_PREVIEW_OPEN,
      ({ code: newCode, language: newLanguage }) => {
        setCode(newCode);
        setLanguage(newLanguage);
        setIsOpen(true);
      },
    );

    // 监听tab切换事件，自动关闭preview panel
    const unsubscribeTabSelect = emitter.on(EventNames.TAB_SELECT, () => {
      setIsOpen(false);
      // 通知 chat-page 更新布局
      emitter.emit(EventNames.CODE_PREVIEW_CLOSE, null);
    });

    return () => {
      unsubscribeOpen();
      unsubscribeTabSelect();
    };
  }, []);

  // ESC键监听
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        emitter.emit(EventNames.CODE_PREVIEW_CLOSE, null);
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  // 关闭面板的处理函数
  const handleClose = () => {
    emitter.emit(EventNames.CODE_PREVIEW_CLOSE, null);
    setIsOpen(false);
  };

  const renderArtifactContent = () => {
    if (drawerContent === "code") {
      return (
        <div className="h-full w-full">
          <div className="h-full w-full overflow-hidden bg-white dark:border-gray-700 dark:bg-gray-800">
            <CodeArtifact code={code} language={language} />
          </div>
        </div>
      );
    }

    switch (language) {
      case "svg":
        return (
          <div className="h-full p-4">
            <SvgArtifact
              block={{
                artifact: {
                  type: "svg",
                  title: `${language.toUpperCase()} SVG Preview`,
                },
                content: code,
              }}
              isPreview={true}
            />
          </div>
        );

      case "html":
        return (
          <div className="h-full w-full">
            <HtmlPreview content={code} isPreview={true} />
          </div>
        );

      default:
        return (
          <div className="h-full w-full">
            <div className="h-full w-full overflow-hidden bg-white dark:border-gray-700 dark:bg-gray-800">
              <CodeArtifact code={code} language={language} />
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          className={`max-lg:!bg-white max-lg:dark:!bg-black absolute top-0 right-0 bottom-0 z-50 flex w-[calc(40%_-_24px)] flex-col border-gray-200 border-l bg-white shadow-lg max-lg:w-3/4 dark:border-gray-700 dark:bg-gray-900 `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* 顶部导航栏 */}
          <div className="flex h-11 items-center justify-between border-gray-200 border-b bg-card px-4 dark:border-gray-700">
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sq-sm"
                intent="plain"
                onClick={handleClose}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft size={18} />
              </Button>
              {/* <h2
                id={titleId}
                className="font-semibold text-gray-800 dark:text-gray-200"
              >
                {language.toUpperCase()} 预览
              </h2> */}
            </div>

            <div className="flex items-center gap-2">
              {/* 预览/代码切换按钮 */}
              <div className="flex items-center rounded-md bg-gray-100 p-0.5 dark:bg-gray-800">
                <Button
                  intent="plain"
                  size="xs"
                  className={`rounded px-3 py-1 font-medium text-xs transition-all duration-200 ${
                    drawerContent === "preview"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                      : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600/50 dark:hover:text-gray-200"
                  }`}
                  onClick={() => setDrawerContent("preview")}
                >
                  {t("preview")}
                </Button>
                <Button
                  intent="plain"
                  size="xs"
                  className={`rounded px-3 py-1 font-medium text-xs transition-all duration-200 ${
                    drawerContent === "code"
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                      : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600/50 dark:hover:text-gray-200"
                  }`}
                  onClick={() => setDrawerContent("code")}
                >
                  {t("code")}
                </Button>
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="h-full flex-1 overflow-auto">
            {renderArtifactContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

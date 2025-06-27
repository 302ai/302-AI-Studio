import logoImage from "@renderer/assets/images/logo.png";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

const { shellService } = window.service;

export function AboutSettings() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.about-settings",
  });

  // 从package.json获取的应用信息
  const appInfo = {
    name: "302 AI Studio",
    version: "25.26.5",
    homepage: "https://302.ai",
    description: "302 AI Studio",
  };

  const handleLinkClick = (url: string) => {
    shellService.openExternal(url);
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Logo和应用信息 - 居中显示 */}
      <div className="flex flex-col items-center gap-4 text-center">
        <img
          src={logoImage}
          alt="302 AI Studio Logo"
          className="h-16 w-16 rounded-lg"
        />
        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">{appInfo.name}</h2>
          <div className="text-secondary-fg text-sm">
            <span>{t("version")} </span>
            <span className="font-mono">{appInfo.version}</span>
          </div>
        </div>
      </div>

      {/* 应用描述 - 居中显示 */}
      <div className="flex flex-col gap-3 text-center">
        <p className="mx-auto max-w-md text-secondary-fg text-sm leading-relaxed">
          {t("description.content")}
        </p>
      </div>

      {/* 官网链接 - 居中显示 */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => handleLinkClick(appInfo.homepage)}
          className="flex items-center gap-2 text-primary text-sm transition-colors hover:text-primary/80"
        >
          <span>{appInfo.homepage}</span>
          <ExternalLink className="size-3" />
        </button>
      </div>

      {/* 版权和许可证信息 - 居中显示 */}
      {/* <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-secondary-fg text-xs">{t("copyright.content")}</p>
        <p className="text-secondary-fg text-xs">{t("license.content")}</p>
      </div> */}
    </div>
  );
}

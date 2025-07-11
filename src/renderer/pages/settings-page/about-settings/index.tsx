import Discord from "@renderer/assets/icons/discord.svg?url";
import Github from "@renderer/assets/icons/github.svg?url";
import Twitter from "@renderer/assets/icons/twitter.svg?url";
import { ModelIcon } from "@renderer/components/business/model-icon";
import { Link } from "@renderer/components/ui/link";
import { Separator } from "@renderer/components/ui/separator";
import { useTranslation } from "react-i18next";
import packageJson from "../../../../../package.json";

const socialMedia = [
  {
    name: "Discord",
    icon: Discord,
    url: "https://discord.com/invite/4fgQ4M6ypq",
  },
  {
    name: "Github",
    icon: Github,
    url: "https://github.com/302ai",
  },
  {
    name: "Twitter",
    icon: Twitter,
    url: "https://x.com/302aiofficial",
  },
];

const { shellService } = window.service;
export function AboutSettings() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.about-settings",
  });

  const appInfo = {
    name: packageJson.productName,
    version: packageJson.version,
    homepage: packageJson.homepage,
    description: packageJson.description,
  };

  const handleLinkClick = (url: string) => {
    shellService.openExternal(url);
  };

  return (
    <div className="flex h-full flex-col items-center justify-between py-8">
      {/* 主要内容区域 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        {/* Logo和应用信息 - 居中显示 */}
        <div className="flex flex-col items-center gap-4 text-center">
          <ModelIcon modelName="302" className="h-16 w-16 rounded-lg" />
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-xl">{appInfo.name}</h2>
            <div className="text-secondary-fg text-sm">
              <span>{t("version")} </span>
              <span className="font-mono">{appInfo.version}</span>
            </div>
          </div>
        </div>
        {/* 应用描述 - 居中显示，限制2行 */}
        <div className="flex flex-col text-center">
          <p className="mx-auto line-clamp-2 max-w-xl text-secondary-fg text-sm leading-relaxed">
            {t("description.content")}
            <Link
              onClick={() => handleLinkClick(appInfo.homepage)}
              className=" inline-flex cursor-pointer items-center gap-1 text-primary text-sm hover:bg-none"
            >
              <span>{appInfo.homepage}</span>
            </Link>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          {socialMedia.map((item) => (
            <button
              key={item.name}
              type="button"
              className="cursor-pointer"
              onClick={() => handleLinkClick(item.url)}
            >
              <img src={item.icon} alt={item.name} />
            </button>
          ))}
        </div>
        <div className="flex items-center text-setting-about-text text-sm">
          <Link
            className="cursor-pointer"
            onClick={() => handleLinkClick("https://help.302.ai/")}
          >
            {t("help-center.title")}
          </Link>
          <Separator orientation="vertical" className="mx-3 h-4" />
          <Link
            className="cursor-pointer"
            onClick={() => handleLinkClick("https://302.ai/terms/")}
          >
            {t("terms-of-service.title")}
          </Link>
          <Separator orientation="vertical" className="mx-3 h-4" />
          <Link
            className="cursor-pointer"
            onClick={() => handleLinkClick("https://302.ai/privacy/")}
          >
            {t("privacy-policy.title")}
          </Link>
        </div>
      </div>
    </div>
  );
}

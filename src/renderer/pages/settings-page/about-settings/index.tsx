import Discord from "@renderer/assets/icons/discord.svg?url";
import Github from "@renderer/assets/icons/github.svg?url";
import Twitter from "@renderer/assets/icons/twitter.svg?url";
import { ModelIcon } from "@renderer/components/business/model-icon";
import { Button } from "@renderer/components/ui/button";
import { Link } from "@renderer/components/ui/link";
import { Separator } from "@renderer/components/ui/separator";
import { cn } from "@renderer/lib/utils";
import { useTranslation } from "react-i18next";
import packageJson from "../../../../../package.json";

const { shellService } = window.service;

export function AboutSettings() {
  const { t } = useTranslation("translation", {
    keyPrefix: "settings.about-settings",
  });

  const { productName, version, homepage } = packageJson;

  const handleLinkClick = (url: string) => {
    shellService.openExternal(url);
  };

  const socialMedias = [
    {
      name: "Github",
      icon: Github,
      action: () => handleLinkClick("https://github.com/302ai"),
    },
    {
      name: "Twitter",
      icon: Twitter,
      action: () => handleLinkClick("https://x.com/302aiofficial"),
    },
    {
      name: "Discord",
      icon: Discord,
      action: () => handleLinkClick("https://discord.com/invite/4fgQ4M6ypq"),
    },
  ] as const;

  const footerLinks = [
    {
      id: 1,
      name: t("help-center.title"),
      action: () => handleLinkClick("https://help.302.ai/"),
    },
    {
      id: 2,
      name: t("terms-of-service.title"),
      action: () => handleLinkClick("https://302.ai/terms/"),
    },
    {
      id: 3,
      name: t("privacy-policy.title"),
      action: () => handleLinkClick("https://302.ai/privacy/"),
    },
  ] as const;

  return (
    <div className="flex h-full flex-col items-center justify-between pb-9">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-y-[22px] text-center">
          <ModelIcon modelName="302" className="size-[62px]" />
          <div className="flex flex-col gap-y-[7px]">
            <span className="font-[500] text-xl">{productName}</span>
            <span className="text-muted-fg text-sm">
              {t("version")} {version}
            </span>
          </div>
        </div>
        <div className="flex flex-col text-center">
          <p className="mx-auto line-clamp-2 max-w-xl text-muted-fg text-sm leading-relaxed">
            {t("description.content")}
            <Link
              onClick={() => handleLinkClick(homepage)}
              className=" inline-flex cursor-pointer items-center gap-1 text-primary text-sm hover:underline"
            >
              {homepage}
            </Link>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          {socialMedias.map((item) => (
            <Button
              key={item.name}
              className="size-7 hover:bg-transparent"
              intent="plain"
              shape="square"
              size="square-petite"
              onClick={item.action}
            >
              <img src={item.icon} alt={item.name} />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-x-4">
          {footerLinks.map((item, index) => (
            <div key={item.id} className="flex items-center gap-x-4">
              <Link
                onClick={item.action}
                className="cursor-pointer text-muted-fg text-sm hover:text-fg"
              >
                {item.name}
              </Link>
              <Separator
                orientation="vertical"
                className={cn("h-5 w-0.5 bg-muted-fg", {
                  "opacity-0": index === footerLinks.length - 1,
                })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

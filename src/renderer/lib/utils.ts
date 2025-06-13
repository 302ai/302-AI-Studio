import { type ClassValue, clsx } from "clsx";
import { formatDistanceToNow, type Locale } from "date-fns";
import { t } from 'i18next';
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(createTime: string, locale: Locale) {
  const now = new Date();
  const diff = now.getTime() - new Date(createTime).getTime();
  const seconds = Math.floor(diff / 1000);

  const customLocale = {
    ...locale,
    formatDistance: (token, count, options) => {
      if (token === "lessThanXMinutes" && count === 1) {
        return t("sidebar.section.justNow");
      }
      return locale.formatDistance(token, count, options);
    },
  };
  // 30秒内显示"刚刚"
  if (seconds < 30) {
    return t("sidebar.section.justNow");
  }

  // 其他情况使用 date-fns
  return formatDistanceToNow(new Date(createTime), {
    addSuffix: true,
    locale: customLocale,
  });
}

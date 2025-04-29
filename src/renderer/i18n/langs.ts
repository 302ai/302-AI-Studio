export interface Language {
  key: string;
  nativeName: string;
  prefix: string;
}

export default [
  {
    key: "zh",
    nativeName: "中文",
    prefix: "🇨🇳",
  },
  {
    key: "en",
    nativeName: "English",
    prefix: "🇺🇸",
  },
  {
    key: "ja",
    nativeName: "日本語",
    prefix: "🇯🇵",
  },
] satisfies Language[];

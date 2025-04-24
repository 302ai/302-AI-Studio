export interface Language {
  key: string;
  nativeName: string;
  prefix: string;
}

export default [
  {
    key: "en",
    nativeName: "English",
    prefix: "🇺🇸",
  },
  {
    key: "zh",
    nativeName: "中文",
    prefix: "🇨🇳",
  },
  {
    key: "ja",
    nativeName: "日本語",
    prefix: "🇯🇵",
  },
] satisfies Language[];

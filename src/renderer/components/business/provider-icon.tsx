// Import icons from model-icon.tsx to keep consistency
import ai302Icon from "@lobehub/icons-static-svg/icons/ai302-color.svg";
import anthropicIcon from "@lobehub/icons-static-svg/icons/anthropic.svg";
import azureIcon from "@lobehub/icons-static-svg/icons/azure-color.svg";
import baiduIcon from "@lobehub/icons-static-svg/icons/baidu-color.svg";
import claudeIcon from "@lobehub/icons-static-svg/icons/claude-color.svg";
import cohereIcon from "@lobehub/icons-static-svg/icons/cohere.svg";
import deepseekIcon from "@lobehub/icons-static-svg/icons/deepseek-color.svg";
import doubaoIcon from "@lobehub/icons-static-svg/icons/doubao-color.svg";
import geminiIcon from "@lobehub/icons-static-svg/icons/gemini-color.svg";
import googleIcon from "@lobehub/icons-static-svg/icons/google-color.svg";
import groqIcon from "@lobehub/icons-static-svg/icons/groq.svg";
import huggingfaceIcon from "@lobehub/icons-static-svg/icons/huggingface.svg";
import metaIcon from "@lobehub/icons-static-svg/icons/meta-color.svg";
import minimaxIcon from "@lobehub/icons-static-svg/icons/minimax-color.svg";
import mistralIcon from "@lobehub/icons-static-svg/icons/mistral-color.svg";
import moonshotIcon from "@lobehub/icons-static-svg/icons/moonshot.svg";
import ollamaIcon from "@lobehub/icons-static-svg/icons/ollama.svg";
import openaiIcon from "@lobehub/icons-static-svg/icons/openai.svg";
import openrouterIcon from "@lobehub/icons-static-svg/icons/openrouter.svg";
import perplexityIcon from "@lobehub/icons-static-svg/icons/perplexity.svg";
import qwenIcon from "@lobehub/icons-static-svg/icons/qwen-color.svg";
import replicateIcon from "@lobehub/icons-static-svg/icons/replicate.svg";
import zhipuIcon from "@lobehub/icons-static-svg/icons/zhipu-color.svg";
import { ModelIcon } from "@renderer/components/business/model-icon";
import { cn } from "@renderer/lib/utils";

// 图标映射表 - 与 icon-picker.tsx 保持一致
const iconMap: Record<string, string> = {
  // AI providers from icon-picker.tsx
  ai302: ai302Icon,
  openai: openaiIcon,
  anthropic: anthropicIcon,
  claude: claudeIcon,
  google: googleIcon,
  gemini: geminiIcon,
  meta: metaIcon,
  azure: azureIcon,
  baidu: baiduIcon,
  qwen: qwenIcon,
  zhipu: zhipuIcon,
  deepseek: deepseekIcon,
  doubao: doubaoIcon,
  moonshot: moonshotIcon,
  minimax: minimaxIcon,
  mistral: mistralIcon,
  huggingface: huggingfaceIcon,
  replicate: replicateIcon,
  cohere: cohereIcon,
  ollama: ollamaIcon,
  groq: groqIcon,
  perplexity: perplexityIcon,
  openrouter: openrouterIcon,
};

interface ProviderIconProps {
  provider: {
    name: string;
    avatar?: string | null;
  };
  className?: string;
}

export function ProviderIcon({ provider, className }: ProviderIconProps) {
  // 如果有自定义头像（base64 或 URL），显示自定义头像
  if (provider.avatar) {
    // 检查是否是 base64 图片
    if (provider.avatar.startsWith("data:image/")) {
      return (
        <img
          src={provider.avatar}
          alt={provider.name}
          className={cn("h-4 w-4 rounded-full", className)}
        />
      );
    }

    // 检查是否在图标映射表中
    if (iconMap[provider.avatar]) {
      const iconUrl = iconMap[provider.avatar];
      return (
        <img
          src={iconUrl}
          alt={provider.name}
          className={cn("h-4 w-4 rounded-full", className)}
        />
      );
    }
  }

  // 否则回退到ModelIcon
  return <ModelIcon modelName={provider.name ?? ""} className={className} />;
}

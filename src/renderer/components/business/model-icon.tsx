// Import commonly used AI model provider icons from LobeHub
import adobeIcon from "@lobehub/icons-static-svg/icons/adobe-color.svg";
import ai302Icon from "@lobehub/icons-static-svg/icons/ai302-color.svg";
import anthropicIcon from "@lobehub/icons-static-svg/icons/anthropic.svg";
import azureIcon from "@lobehub/icons-static-svg/icons/azure-color.svg";
import baiduIcon from "@lobehub/icons-static-svg/icons/baidu-color.svg";
import claudeIcon from "@lobehub/icons-static-svg/icons/claude-color.svg";
import cohereIcon from "@lobehub/icons-static-svg/icons/cohere.svg";
import deepseekIcon from "@lobehub/icons-static-svg/icons/deepseek-color.svg";
import doubaoIcon from "@lobehub/icons-static-svg/icons/doubao-color.svg";
import fireworksIcon from "@lobehub/icons-static-svg/icons/fireworks-color.svg";
import geminiIcon from "@lobehub/icons-static-svg/icons/gemini-color.svg";
import githubIcon from "@lobehub/icons-static-svg/icons/github.svg";
import googleIcon from "@lobehub/icons-static-svg/icons/google-color.svg";
import grokIcon from "@lobehub/icons-static-svg/icons/grok.svg";
import groqIcon from "@lobehub/icons-static-svg/icons/groq.svg";
import huggingfaceIcon from "@lobehub/icons-static-svg/icons/huggingface.svg";
import hunyuanIcon from "@lobehub/icons-static-svg/icons/hunyuan-color.svg";
import lmstudioIcon from "@lobehub/icons-static-svg/icons/lmstudio.svg";
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
import sensenovaIcon from "@lobehub/icons-static-svg/icons/sensenova-color.svg";
import siliconcloudIcon from "@lobehub/icons-static-svg/icons/siliconcloud-color.svg";
import sparkIcon from "@lobehub/icons-static-svg/icons/spark-color.svg";
import stabilityIcon from "@lobehub/icons-static-svg/icons/stability-color.svg";
import stepfunIcon from "@lobehub/icons-static-svg/icons/stepfun-color.svg";
import tencentIcon from "@lobehub/icons-static-svg/icons/tencent-brand-color.svg";
import tencentcloudIcon from "@lobehub/icons-static-svg/icons/tencentcloud-color.svg";
import togetherIcon from "@lobehub/icons-static-svg/icons/together-color.svg";
import upstageIcon from "@lobehub/icons-static-svg/icons/upstage-color.svg";
import vercelIcon from "@lobehub/icons-static-svg/icons/vercel.svg";
import vertexaiIcon from "@lobehub/icons-static-svg/icons/vertexai-color.svg";
import wenxinIcon from "@lobehub/icons-static-svg/icons/wenxin-color.svg";
import workersaiIcon from "@lobehub/icons-static-svg/icons/workersai-color.svg";
import xaiIcon from "@lobehub/icons-static-svg/icons/xai.svg";
import yiIcon from "@lobehub/icons-static-svg/icons/yi-color.svg";
import zhipuIcon from "@lobehub/icons-static-svg/icons/zhipu-color.svg";
import { cn } from "@renderer/lib/utils";

import { useMemo } from "react";

// Colored icons set - icons that should not be inverted in dark mode
const coloredIcons = new Set([
  ai302Icon,
  azureIcon,
  baiduIcon,
  claudeIcon,
  deepseekIcon,
  doubaoIcon,
  fireworksIcon,
  geminiIcon,
  googleIcon,
  hunyuanIcon,
  minimaxIcon,
  // qwenIcon,
  metaIcon,
  sensenovaIcon,
  siliconcloudIcon,
  sparkIcon,
  stabilityIcon,
  stepfunIcon,
  tencentIcon,
  tencentcloudIcon,
  togetherIcon,
  upstageIcon,
  vertexaiIcon,
  wenxinIcon,
  workersaiIcon,
  mistralIcon,
  // yiIcon,
  zhipuIcon,
]);

// Icon mapping object
const iconMap: Record<string, string> = {
  // 302.AI
  "302": ai302Icon,
  "302ai": ai302Icon,
  ai302: ai302Icon,

  // OpenAI
  openai: openaiIcon,
  gpt: openaiIcon,
  "gpt-3": openaiIcon,
  "gpt-4": openaiIcon,
  "gpt-3.5": openaiIcon,
  "gpt-4o": openaiIcon,
  o1: openaiIcon,
  o3: openaiIcon,
  o4: openaiIcon,
  chatgpt: openaiIcon,
  "dall-e": openaiIcon,
  dalle: openaiIcon,
  whisper: openaiIcon,

  // Anthropic
  anthropic: anthropicIcon,
  claude: claudeIcon,
  "claude-3": claudeIcon,
  "claude-2": claudeIcon,

  // Google
  google: googleIcon,
  gemini: geminiIcon,
  gemma: googleIcon,
  palm: googleIcon,
  bard: googleIcon,
  vertex: vertexaiIcon,
  vertexai: vertexaiIcon,

  // Meta
  meta: metaIcon,
  llama: metaIcon,
  "llama-2": metaIcon,
  "llama-3": metaIcon,

  // Microsoft
  azure: azureIcon,
  microsoft: azureIcon,

  // Chinese providers
  qwen: qwenIcon,
  tongyi: qwenIcon,
  alibaba: qwenIcon,
  dashscope: qwenIcon,
  zhipu: zhipuIcon,
  glm: zhipuIcon,
  chatglm: zhipuIcon,
  baidu: baiduIcon,
  wenxin: wenxinIcon,
  ernie: wenxinIcon,
  spark: sparkIcon,
  doubao: doubaoIcon,
  bytedance: doubaoIcon,
  hunyuan: hunyuanIcon,
  tencent: tencentIcon,
  tencentcloud: tencentcloudIcon,
  minimax: minimaxIcon,
  stepfun: stepfunIcon,
  yi: yiIcon,
  "01ai": yiIcon,
  sensenova: sensenovaIcon,
  siliconcloud: siliconcloudIcon,
  silicon: siliconcloudIcon,

  // Other providers
  deepseek: deepseekIcon,
  moonshot: moonshotIcon,
  kimi: moonshotIcon,
  stability: stabilityIcon,
  stable: stabilityIcon,
  "stable-diffusion": stabilityIcon,
  grok: grokIcon,
  xai: xaiIcon,
  groq: groqIcon,
  perplexity: perplexityIcon,
  cohere: cohereIcon,
  mistral: mistralIcon,
  huggingface: huggingfaceIcon,
  replicate: replicateIcon,

  // Self-hosted/Local
  ollama: ollamaIcon,
  lmstudio: lmstudioIcon,

  // API providers
  together: togetherIcon,
  fireworks: fireworksIcon,
  openrouter: openrouterIcon,
  workersai: workersaiIcon,
  cloudflare: workersaiIcon,

  // Cloud platforms
  github: githubIcon,
  vercel: vercelIcon,
  upstage: upstageIcon,

  // Adobe
  adobe: adobeIcon,

  // Default
  default: ai302Icon,
};

interface ModelIconProps {
  modelName: string;
  className?: string;
}

function getIconFromModelName(modelName: string): {
  iconUrl: string;
  isColorIcon: boolean;
} {
  if (!modelName || typeof modelName !== "string") {
    return { iconUrl: iconMap.default, isColorIcon: true }; // default is colored
  }

  const modelNameLower = modelName.toLowerCase();
  // Direct match first
  if (iconMap[modelNameLower]) {
    return {
      iconUrl: iconMap[modelNameLower],
      isColorIcon: coloredIcons.has(iconMap[modelNameLower]),
    };
  }

  // Try to find a match by checking if model name contains any of the keys
  for (const [key, icon] of Object.entries(iconMap)) {
    if (key !== "default" && modelNameLower.includes(key)) {
      return { iconUrl: icon, isColorIcon: coloredIcons.has(icon) };
    }
  }

  // Try to extract provider from common patterns
  // e.g., "openai/gpt-4" -> "openai", "claude-3-haiku" -> "claude"
  const providerPatterns = [
    /^([^/\-_]+)[/\-_]/, // Extract before first separator
    /^(\w+)/,
  ]; // Extract first word
  for (const pattern of providerPatterns) {
    const match = modelNameLower.match(pattern);
    if (match?.[1] && iconMap[match[1]]) {
      return {
        iconUrl: iconMap[match[1]],
        isColorIcon: coloredIcons.has(iconMap[match[1]]),
      };
    }
  }
  return { iconUrl: iconMap.default, isColorIcon: true }; // default is colored
}

export function ModelIcon({ modelName, className }: ModelIconProps) {
  const { iconUrl, isColorIcon } = useMemo(
    () => getIconFromModelName(modelName),
    [modelName],
  );

  return (
    <img
      src={iconUrl}
      className={cn(
        "h-4 w-4 rounded-full",
        // Only apply dark mode filters to monochrome icons
        !isColorIcon && "dark:brightness-0 dark:invert dark:filter",
        className,
      )}
      alt={modelName || "Model Icon"}
      onError={(e) => {
        // Fallback to default icon if image fails to load
        const target = e.target as HTMLImageElement;
        if (target.src !== iconMap.default) {
          target.src = iconMap.default;
        }
      }}
    />
  );
}

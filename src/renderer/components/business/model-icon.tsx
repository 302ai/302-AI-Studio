import adobeColorIcon from "@renderer/assets/llm-icons/adobe-color.svg?url";
import aihubmixColorIcon from "@renderer/assets/llm-icons/aihubmix.png?url";
import dashscopeColorIcon from "@renderer/assets/llm-icons/alibabacloud-color.svg?url";
import anthropicColorIcon from "@renderer/assets/llm-icons/anthropic.svg?url";
import azureOpenaiColorIcon from "@renderer/assets/llm-icons/azure-color.svg?url";
import deepseekColorIcon from "@renderer/assets/llm-icons/deepseek-color.svg?url";
import doubaoColorIcon from "@renderer/assets/llm-icons/doubao-color.svg?url";
import fireworksColorIcon from "@renderer/assets/llm-icons/fireworks-color.svg?url";
import geminiColorIcon from "@renderer/assets/llm-icons/gemini-color.svg?url";
import githubColorIcon from "@renderer/assets/llm-icons/github.svg?url";
import googleColorIcon from "@renderer/assets/llm-icons/google-color.svg?url";
import grokColorIcon from "@renderer/assets/llm-icons/grok.svg?url";
import hunyuanColorIcon from "@renderer/assets/llm-icons/hunyuan-color.svg?url";
import lmstudioColorIcon from "@renderer/assets/llm-icons/lmstudio.svg?url";
import defaultIcon from "@renderer/assets/llm-icons/logo.png?url";
import metaColorIcon from "@renderer/assets/llm-icons/meta.svg?url";
import minimaxColorIcon from "@renderer/assets/llm-icons/minimax-color.svg?url";
import moonshotColorIcon from "@renderer/assets/llm-icons/moonshot.svg?url";
import ollamaColorIcon from "@renderer/assets/llm-icons/ollama.svg?url";
import openaiColorIcon from "@renderer/assets/llm-icons/openai.svg?url";
import openrouterColorIcon from "@renderer/assets/llm-icons/openrouter.svg?url";
import ppioColorIcon from "@renderer/assets/llm-icons/ppio-color.svg?url";
import qingyanColorIcon from "@renderer/assets/llm-icons/qingyan-color.svg?url";
import qiniuIcon from "@renderer/assets/llm-icons/qiniu.svg?url";
import qwenColorIcon from "@renderer/assets/llm-icons/qwen-color.svg?url";
import rwkvColorIcon from "@renderer/assets/llm-icons/rwkv.svg?url";
import sensenovaColorIcon from "@renderer/assets/llm-icons/sensenova-color.svg?url";
import siliconcloudColorIcon from "@renderer/assets/llm-icons/siliconcloud-color.svg?url";
import sparkColorIcon from "@renderer/assets/llm-icons/spark-color.svg?url";
import stabilityColorIcon from "@renderer/assets/llm-icons/stability-color.svg?url";
import stepfunColorIcon from "@renderer/assets/llm-icons/stepfun-color.svg?url";
import sunoColorIcon from "@renderer/assets/llm-icons/suno.svg?url";
import syncColorIcon from "@renderer/assets/llm-icons/sync.svg?url";
import tencentColorIcon from "@renderer/assets/llm-icons/tencent-color.svg?url";
import tencentcloudColorIcon from "@renderer/assets/llm-icons/tencentcloud-color.svg?url";
import tiangongColorIcon from "@renderer/assets/llm-icons/tiangong-color.svg?url";
import tiiColorIcon from "@renderer/assets/llm-icons/tii-color.svg?url";
import togetherColorIcon from "@renderer/assets/llm-icons/together-color.svg?url";
import tripoColorIcon from "@renderer/assets/llm-icons/tripo-color.svg?url";
import udionColorIcon from "@renderer/assets/llm-icons/udio-color.svg?url";
import upstageColorIcon from "@renderer/assets/llm-icons/upstage-color.svg?url";
import vercelColorIcon from "@renderer/assets/llm-icons/vercel.svg?url";
import vertexaiColorIcon from "@renderer/assets/llm-icons/vertexai-color.svg?url";
import viduColorIcon from "@renderer/assets/llm-icons/vidu-color.svg?url";
import viggleColorIcon from "@renderer/assets/llm-icons/viggle.svg?url";
import vllmColorIcon from "@renderer/assets/llm-icons/vllm-color.svg?url";
import volcengineColorIcon from "@renderer/assets/llm-icons/volcengine-color.svg?url";
import wenxinColorIcon from "@renderer/assets/llm-icons/wenxin-color.svg?url";
import workersaiColorIcon from "@renderer/assets/llm-icons/workersai-color.svg?url";
import xaiColorIcon from "@renderer/assets/llm-icons/xai.svg?url";
import xuanyuanColorIcon from "@renderer/assets/llm-icons/xuanyuan-color.svg?url";
import yiColorIcon from "@renderer/assets/llm-icons/yi-color.svg?url";
import zeaburColorIcon from "@renderer/assets/llm-icons/zeabur-color.svg?url";
import zerooneColorIcon from "@renderer/assets/llm-icons/zeroone.svg?url";
import zhipuColorIcon from "@renderer/assets/llm-icons/zhipu-color.svg?url";
import { cn } from "@renderer/lib/utils";
import { useMemo } from "react";

// 导入所有图标
const icons = {
  aihubmix: aihubmixColorIcon,
  dashscope: dashscopeColorIcon,
  hunyuan: hunyuanColorIcon,
  grok: grokColorIcon,
  qiniu: qiniuIcon,
  gemma: googleColorIcon,
  claude: anthropicColorIcon,
  azure: azureOpenaiColorIcon,
  deepseek: deepseekColorIcon,
  lmstudio: lmstudioColorIcon,
  adobe: adobeColorIcon,
  openai: openaiColorIcon,
  ollama: ollamaColorIcon,
  doubao: doubaoColorIcon,
  minimax: minimaxColorIcon,
  fireworks: fireworksColorIcon,
  zeabur: zeaburColorIcon,
  zeroone: zerooneColorIcon,
  zhipu: zhipuColorIcon,
  vllm: vllmColorIcon,
  volcengine: volcengineColorIcon,
  wenxin: wenxinColorIcon,
  workersai: workersaiColorIcon,
  xai: xaiColorIcon,
  xuanyuan: xuanyuanColorIcon,
  yi: yiColorIcon,
  udio: udionColorIcon,
  upstage: upstageColorIcon,
  vercel: vercelColorIcon,
  vertexai: vertexaiColorIcon,
  vidu: viduColorIcon,
  viggle: viggleColorIcon,
  tiangong: tiangongColorIcon,
  tii: tiiColorIcon,
  together: togetherColorIcon,
  tripo: tripoColorIcon,
  stepfun: stepfunColorIcon,
  suno: sunoColorIcon,
  sync: syncColorIcon,
  tencent: tencentColorIcon,
  tencentcloud: tencentcloudColorIcon,
  rwkv: rwkvColorIcon,
  sensenova: sensenovaColorIcon,
  silicon: siliconcloudColorIcon,
  spark: sparkColorIcon,
  stability: stabilityColorIcon,
  ppio: ppioColorIcon,
  qingyan: qingyanColorIcon,
  qwen: qwenColorIcon,
  moonshot: moonshotColorIcon,
  openrouter: openrouterColorIcon,
  gemini: geminiColorIcon,
  github: githubColorIcon,
  anthropic: anthropicColorIcon,
  gpt: openaiColorIcon,
  o1: openaiColorIcon,
  o3: openaiColorIcon,
  llama: metaColorIcon,
  o4: openaiColorIcon,
  glm: zhipuColorIcon,
  meta: metaColorIcon,
  default: defaultIcon,
};

interface ModelIconProps {
  modelName: string;
  className?: string;
}

export function ModelIcon({ modelName, className }: ModelIconProps) {
  const iconKey = useMemo(() => {
    if (!modelName || typeof modelName !== 'string') {
      return "default";
    }

    const modelNameLower = modelName.toLowerCase();
    const iconEntries = Object.keys(icons);

    const matchedIcon = iconEntries.find((key) => {
      return modelNameLower.includes(key);
    });
    return matchedIcon ? matchedIcon : "default";
  }, [modelName]);

  return (
    <img
      src={icons[iconKey]}
      className={cn("h-4 w-4 rounded-full dark:bg-white", className)}
      alt={modelName || "Model Icon"}
    />
  );
}

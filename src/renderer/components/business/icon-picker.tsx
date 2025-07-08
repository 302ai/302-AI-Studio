// Import icons from model-icon.tsx
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
import { Popover, PopoverContent } from "@renderer/components/ui/popover";
import { cn } from "@renderer/lib/utils";
import { FileImage } from "lucide-react";
import { useState } from "react";

const aiIcons = [
  { name: "302.AI", key: "ai302", icon: ai302Icon },
  { name: "OpenAI", key: "openai", icon: openaiIcon },
  { name: "Anthropic", key: "anthropic", icon: anthropicIcon },
  { name: "Claude", key: "claude", icon: claudeIcon },
  { name: "Google", key: "google", icon: googleIcon },
  { name: "Gemini", key: "gemini", icon: geminiIcon },
  { name: "Meta", key: "meta", icon: metaIcon },
  { name: "Azure", key: "azure", icon: azureIcon },
  { name: "Baidu", key: "baidu", icon: baiduIcon },
  { name: "Qwen", key: "qwen", icon: qwenIcon },
  { name: "ChatGLM", key: "zhipu", icon: zhipuIcon },
  { name: "DeepSeek", key: "deepseek", icon: deepseekIcon },
  { name: "Doubao", key: "doubao", icon: doubaoIcon },
  { name: "Moonshot", key: "moonshot", icon: moonshotIcon },
  { name: "MiniMax", key: "minimax", icon: minimaxIcon },
  { name: "Mistral", key: "mistral", icon: mistralIcon },
  { name: "Hugging Face", key: "huggingface", icon: huggingfaceIcon },
  { name: "Replicate", key: "replicate", icon: replicateIcon },
  { name: "Cohere", key: "cohere", icon: cohereIcon },
  { name: "Ollama", key: "ollama", icon: ollamaIcon },
  { name: "Groq", key: "groq", icon: groqIcon },
  { name: "Perplexity", key: "perplexity", icon: perplexityIcon },
  { name: "OpenRouter", key: "openrouter", icon: openrouterIcon },
];

interface IconPickerProps {
  value?: string;
  onChange: (iconKey: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 获取当前选中的图标
  const selectedIcon = value
    ? aiIcons.find((icon) => icon.key === value)
    : null;

  const handleIconSelect = (iconKey: string) => {
    onChange(iconKey);
    setIsOpen(false);
  };

  return (
    <Popover>
      <Popover.Trigger>
        <button
          type="button"
          className={cn(
            "flex size-[40px] items-center justify-center rounded-lg bg-gray-200 transition-colors hover:bg-gray-300",
            className,
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedIcon ? (
            <img
              src={selectedIcon.icon}
              alt={selectedIcon.name}
              className="size-6"
            />
          ) : (
            <span className="text-gray-500 text-xs">
              <FileImage />
            </span>
          )}
        </button>
      </Popover.Trigger>

      <PopoverContent
        className="w-80 p-4"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <div className="h-64 overflow-y-auto">
          <div className="grid grid-cols-4 gap-3">
            {aiIcons.map((iconItem) => (
              <button
                type="button"
                key={iconItem.key}
                onClick={() => handleIconSelect(iconItem.key)}
                className={cn(
                  "flex flex-col items-center rounded p-2 transition-colors hover:bg-gray-100",
                  value === iconItem.key && "bg-blue-100 text-blue-700",
                )}
                title={iconItem.name}
              >
                <img
                  src={iconItem.icon}
                  alt={iconItem.name}
                  className="mb-1 size-8"
                />
                <span className="w-full truncate text-center text-xs">
                  {iconItem.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

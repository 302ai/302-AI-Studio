import { ModelIcon } from "@renderer/components/business/model-icon";
import { Popover, PopoverContent } from "@renderer/components/ui/popover";
import { cn } from "@renderer/lib/utils";
import { FileImage } from "lucide-react";
import { useState } from "react";

// 使用与ModelIcon相同的图标定义，确保一致性
const aiIcons = [
  { name: "302.AI", key: "ai302" },
  { name: "OpenAI", key: "openai" },
  { name: "Anthropic", key: "anthropic" },
  { name: "Claude", key: "claude" },
  { name: "Google", key: "google" },
  { name: "Gemini", key: "gemini" },
  { name: "Meta", key: "meta" },
  { name: "Azure", key: "azure" },
  { name: "Baidu", key: "baidu" },
  { name: "Qwen", key: "qwen" },
  { name: "ChatGLM", key: "zhipu" },
  { name: "DeepSeek", key: "deepseek" },
  { name: "Doubao", key: "doubao" },
  { name: "Moonshot", key: "moonshot" },
  { name: "MiniMax", key: "minimax" },
  { name: "Mistral", key: "mistral" },
  { name: "Hugging Face", key: "huggingface" },
  { name: "Replicate", key: "replicate" },
  { name: "Cohere", key: "cohere" },
  { name: "Ollama", key: "ollama" },
  { name: "Groq", key: "groq" },
  { name: "Perplexity", key: "perplexity" },
  { name: "OpenRouter", key: "openrouter" },
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
      <Popover.Trigger
        className={cn(
          "flex size-[40px] items-center justify-center rounded-lg bg-muted transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className,
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedIcon ? (
          <ModelIcon modelName={selectedIcon.key} className="size-6" />
        ) : (
          <span className="text-muted-fg text-xs">
            <FileImage />
          </span>
        )}
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
                  "flex flex-col items-center rounded p-2 text-muted-fg transition-colors hover:bg-muted/50 hover:text-fg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  value === iconItem.key &&
                    "bg-primary/10 text-primary ring-2 ring-primary/20",
                )}
                title={iconItem.name}
              >
                <ModelIcon modelName={iconItem.key} className="mb-1 size-8" />
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

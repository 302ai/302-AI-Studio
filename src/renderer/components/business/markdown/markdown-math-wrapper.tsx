import { cn } from "@renderer/lib/utils";
import { useEffect, useRef, useState } from "react";
import { CopyButton } from "../copy-button";

// Regex to check if the processed content contains any potential LaTeX patterns
const containsLatexRegex =
  /\\\(.*?\\\)|\\\[.*?\\\]|\$.*?\$|\\begin\{equation\}.*?\\end\{equation\}/;

// Regex for inline and block LaTeX expressions
const inlineLatex = new RegExp(/\\\((.+?)\\\)/, "g");
const blockLatex = new RegExp(/\\\[(.*?[^\\])\\\]/, "gs");

// Function to restore code blocks
const restoreCodeBlocks = (content: string, codeBlocks: string[]) => {
  return content.replace(
    /<<CODE_BLOCK_(\d+)>>/g,
    (_match, index) => codeBlocks[index],
  );
};

// Regex to identify code blocks and inline code
const codeBlockRegex = /(```[\s\S]*?```|`.*?`)/g;

export const processLaTeX = (_content: string) => {
  let content = _content;
  // Temporarily replace code blocks and inline code with placeholders
  const codeBlocks: string[] = [];
  let index = 0;
  content = content.replace(codeBlockRegex, (match) => {
    codeBlocks[index] = match;
    return `<<CODE_BLOCK_${index++}>>`;
  });

  // Escape dollar signs followed by a digit or space and digit
  let processedContent = content.replace(/(\$)(?=\s?\d)/g, "\\$");

  // If no LaTeX patterns are found, restore code blocks and return the processed content
  if (!containsLatexRegex.test(processedContent)) {
    return restoreCodeBlocks(processedContent, codeBlocks);
  }

  // Convert LaTeX expressions to a markdown compatible format
  processedContent = processedContent
    .replace(inlineLatex, (_match: string, equation: string) => `$${equation}$`) // Convert inline LaTeX
    .replace(
      blockLatex,
      (_match: string, equation: string) => `$$${equation}$$`,
    ); // Convert block LaTeX

  // Restore code blocks
  return restoreCodeBlocks(processedContent, codeBlocks);
};

export function MarkdownMathWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [latex, setLatex] = useState("");
  const [isDisplay, setIsDisplay] = useState(false);

  useEffect(() => {
    if (ref.current) {
      const annotation = ref.current.querySelector(".katex-mathml annotation");
      if (annotation) {
        setLatex(annotation.textContent || "");
      }

      setIsDisplay(!!ref.current.closest(".katex-display"));
    }
  }, []);

  return (
    <span
      ref={ref}
      className={cn(
        "group/math relative rounded-xl bg-muted p-3 text-sm",
        isDisplay ? "block" : "inline-block",
      )}
    >
      {children}
      {latex && (
        <span
          className={cn(
            "invisible absolute flex space-x-1 opacity-0 transition-all duration-200 group-hover/math:visible group-hover/math:opacity-100",
            isDisplay ? "top-2 right-2" : "-top-6 -translate-x-1/2 left-1/2",
          )}
        >
          <CopyButton content={latex} />
        </span>
      )}
    </span>
  );
}

/** biome-ignore-all lint/suspicious/noExplicitAny: ignore any */

import { cn } from "@renderer/lib/utils";
import type React from "react";
import { MarkdownCodeBlock } from "./markdown-code-block";

export const COMPONENTS = {
  h1: withClass("h1", "text-2xl font-semibold"),
  h2: withClass("h2", "font-semibold text-xl"),
  h3: withClass("h3", "font-semibold text-lg"),
  h4: withClass("h4", "font-semibold text-base"),
  h5: withClass("h5", "font-medium"),
  strong: withClass("strong", "font-semibold"),
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: withClass("blockquote", "border-l-2 border-primary pl-4"),
  code: ({ children, className, ...rest }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <MarkdownCodeBlock className={className} language={match[1]} {...rest}>
        {children}
      </MarkdownCodeBlock>
    ) : (
      <code
        className={cn(
          "font-mono [:not(pre)>&]:rounded-md [:not(pre)>&]:bg-background/50 [:not(pre)>&]:px-1 [:not(pre)>&]:py-0.5",
        )}
        {...rest}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => children,
  ol: withClass("ol", "list-decimal space-y-2 pl-6"),
  ul: withClass("ul", "list-disc space-y-2 pl-6"),
  li: withClass("li", "my-1.5"),
  table: withClass(
    "table",
    "w-full border-collapse overflow-y-auto rounded-md border border-border/20",
  ),
  th: withClass(
    "th",
    "border border-border/20 px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
  ),
  td: withClass(
    "td",
    "border border-border/20 px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
  ),
  tr: withClass("tr", "m-0 border-t p-0 even:bg-muted"),
  p: withClass(
    "p",
    "whitespace-pre-wrap [&_.katex]:leading-tight [&_.katex-display]:leading-tight [&_.katex]:subpixel-antialiased [&_.katex-display]:subpixel-antialiased",
  ),
  hr: withClass("hr", "border-border/20"),
  mark: withClass("mark", "bg-yellow-200 dark:bg-yellow-800 rounded px-1"),
};

function withClass(Tag: keyof React.JSX.IntrinsicElements, classes: string) {
  const Component = ({ ...props }: any) => (
    <Tag className={classes} {...props} />
  );
  Component.displayName = Tag;
  return Component;
}

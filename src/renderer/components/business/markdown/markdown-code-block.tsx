/** biome-ignore-all lint/suspicious/noExplicitAny: ignore any */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: ignore array index key */
import { cn } from "@renderer/lib/utils";
import mermaid from "mermaid";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { bundledLanguages, codeToTokens } from "shiki";
import { CopyButton } from "../copy-button";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  language: string;
}

export function MarkdownCodeBlock({
  children,
  className,
  language,
  ...restProps
}: CodeBlockProps) {
  const code =
    typeof children === "string"
      ? children
      : childrenTakeAllStringContents(children);

  if (language === "mermaid") {
    return <MermaidWrapper>{code}</MermaidWrapper>;
  }

  const preClass = cn(
    "overflow-x-scroll rounded-md border bg-background/50 p-4 font-mono text-sm [scrollbar-width:none]",
    className,
  );

  return (
    <div className="group/code relative my-3">
      <Suspense
        fallback={
          <pre className={preClass} {...restProps}>
            {children}
          </pre>
        }
      >
        <HighlightedPre language={language} className={preClass}>
          {code}
        </HighlightedPre>

        <div className="invisible absolute top-2 right-2 flex space-x-1 opacity-0 transition-all duration-200 group-hover/code:visible group-hover/code:opacity-100">
          <CopyButton content={code} />
        </div>
      </Suspense>
    </div>
  );
}

function childrenTakeAllStringContents(element: any): string {
  if (typeof element === "string") {
    return element;
  }

  if (element?.props?.children) {
    const children = element.props.children;

    if (Array.isArray(children)) {
      return children
        .map((child) => childrenTakeAllStringContents(child))
        .join("");
    } else {
      return childrenTakeAllStringContents(children);
    }
  }

  return "";
}

const MermaidWrapper = ({ children }: { children: string }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { t } = useTranslation("translation", {
    keyPrefix: "message-list.markdown",
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      renderDiagram();
    }, 300);

    async function renderDiagram() {
      if (!children.trim()) return;

      try {
        const isValid = await mermaid.parse(children);
        if (!isValid) return;

        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
        });

        const { svg } = await mermaid.render(
          `mermaid-${Math.random().toString(36).substring(2, 9)}`,
          children,
        );
        setSvg(svg);
        setError("");
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
        setSvg("");
      }
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [children]);

  if (!svg && !error) {
    return (
      <div ref={elementRef} className="text-muted-fg">
        {t("generating-diagram")}
      </div>
    );
  }

  if (error) {
    const isIncomplete =
      error.includes("Syntax error") || error.includes("Invalid");
    return (
      <div ref={elementRef} className="text-muted-fg">
        {isIncomplete ? t("waiting-for-diagram") : t("diagram-syntax-error")}
      </div>
    );
  }

  return (
    <div className="group/mermaid relative my-4">
      <div ref={elementRef} className="flex justify-center overflow-x-auto" />
      <div className="invisible absolute top-2 right-2 flex space-x-1 p-1 opacity-0 transition-all duration-200 group-hover/mermaid:visible group-hover/mermaid:opacity-100">
        <CopyButton content={children} />
      </div>
    </div>
  );
};

interface HighlightedPre extends React.HTMLAttributes<HTMLPreElement> {
  children: string;
  language: string;
}

const HighlightedPre = React.memo(
  ({ children, language, ...props }: HighlightedPre) => {
    const [tokens, setTokens] = useState<any[]>([]);

    useEffect(() => {
      async function highlightCode() {
        if (!(language in bundledLanguages)) {
          return;
        }

        const result = await codeToTokens(children, {
          lang: language as keyof typeof bundledLanguages,
          defaultColor: false,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        });

        setTokens(result.tokens);
      }

      highlightCode();
    }, [children, language]);

    if (!tokens.length) {
      return <pre {...props}>{children}</pre>;
    }

    return (
      <pre {...props}>
        <code>
          {tokens.map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              <span>
                {line.map((token: any, tokenIndex: number) => {
                  const style =
                    typeof token.htmlStyle === "string"
                      ? undefined
                      : token.htmlStyle;

                  return (
                    <span
                      key={tokenIndex}
                      className="bg-[var(--shiki-light-bg)] text-[var(--shiki-light)] dark:bg-[var(--shiki-dark-bg)] dark:text-[var(--shiki-dark)]"
                      style={style}
                    >
                      {token.content}
                    </span>
                  );
                })}
              </span>
              {lineIndex !== tokens.length - 1 && "\n"}
            </React.Fragment>
          ))}
        </code>
      </pre>
    );
  },
);
HighlightedPre.displayName = "HighlightedCode";

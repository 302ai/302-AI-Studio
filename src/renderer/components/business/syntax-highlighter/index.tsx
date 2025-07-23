import { cn } from "@renderer/lib/utils";
import React, { useEffect, useState } from "react";
import { bundledLanguages, codeToTokens } from "shiki";

interface SyntaxHighlighterProps {
  children: string;
  language: string;
  showLineNumbers?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface TokenStyle {
  color?: string;
  backgroundColor?: string;
  fontStyle?: string;
  fontWeight?: string;
  textDecoration?: string;
}

interface Token {
  content: string;
  htmlStyle?: TokenStyle | string;
}

type TokenLine = Token[];

const SyntaxHighlighter = React.memo(
  ({ children, language, showLineNumbers = false, className, style }: SyntaxHighlighterProps) => {
    const [tokens, setTokens] = useState<TokenLine[]>([]);
    const [isHighlighting, setIsHighlighting] = useState(true);

    useEffect(() => {
      async function highlightCode() {
        setIsHighlighting(true);
        
        // Check if language is supported by Shiki
        if (!(language in bundledLanguages)) {
          setTokens([]);
          setIsHighlighting(false);
          return;
        }

        try {
          const result = await codeToTokens(children, {
            lang: language as keyof typeof bundledLanguages,
            defaultColor: false,
            themes: {
              light: "github-light",
              dark: "github-dark",
            },
          });

          setTokens(result.tokens);
        } catch (error) {
          console.warn("Failed to highlight code:", error);
          setTokens([]);
        } finally {
          setIsHighlighting(false);
        }
      }

      highlightCode();
    }, [children, language]);

    // If highlighting is in progress or failed, show plain text
    if (isHighlighting || !tokens.length) {
      return (
        <pre className={className} style={style}>
          <code
            className={cn(
              "block whitespace-pre",
              showLineNumbers && "grid",
            )}
          >
            {children.split("\n").map((line, index) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: Line numbers are stable
                key={`line-${index}`}
                className={cn(
                  "block min-h-[1.25rem]",
                  showLineNumbers &&
                    "grid grid-cols-[auto_1fr] items-start gap-4",
                )}
              >
                {showLineNumbers && (
                  <span className="w-12 shrink-0 select-none text-right text-muted-fg">
                    {index + 1}
                  </span>
                )}
                <span
                  className={cn(
                    "whitespace-pre-wrap break-words",
                    !showLineNumbers && "block",
                  )}
                >
                  {line || " "}
                </span>
              </span>
            ))}
          </code>
        </pre>
      );
    }

    return (
      <pre className={className} style={style}>
        <code
          className={cn(
            "block whitespace-pre",
            showLineNumbers && "grid",
          )}
        >
          {tokens.map((line, lineIndex) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: Line numbers are stable
              key={`highlighted-line-${lineIndex}`}
              className={cn(
                "block min-h-[1.25rem]",
                showLineNumbers &&
                  "grid grid-cols-[auto_1fr] items-start gap-4",
              )}
            >
              {showLineNumbers && (
                <span className="w-12 shrink-0 select-none text-right text-muted-fg">
                  {lineIndex + 1}
                </span>
              )}
              <span
                className={cn(
                  "whitespace-pre-wrap break-words",
                  !showLineNumbers && "block",
                )}
              >
                {line.map((token: Token, tokenIndex: number) => {
                  const style =
                    typeof token.htmlStyle === "string"
                      ? undefined
                      : token.htmlStyle;

                  return (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: Token positions are stable within lines
                      key={tokenIndex}
                      className="bg-[var(--shiki-light-bg)] text-[var(--shiki-light)] dark:bg-[var(--shiki-dark-bg)] dark:text-[var(--shiki-dark)]"
                      style={style}
                    >
                      {token.content}
                    </span>
                  );
                })}
              </span>
            </span>
          ))}
        </code>
      </pre>
    );
  },
);

SyntaxHighlighter.displayName = "SyntaxHighlighter";

export { SyntaxHighlighter };
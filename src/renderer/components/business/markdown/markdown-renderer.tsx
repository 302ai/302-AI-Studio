/** biome-ignore-all lint/suspicious/noExplicitAny: ignore any */
import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { COMPONENTS } from "./markdown-components";
import { MarkdownMathWrapper, processLaTeX } from "./markdown-math-wrapper";

const katexOptions = {
  strict: false,
  trust: true,
  throwOnError: false,
  macros: {
    '\\f': 'f(#1)',
    '\\RR': '\\mathbb{R}',
    '\\NN': '\\mathbb{N}',
    '\\ZZ': '\\mathbb{Z}',
    '\\CC': '\\mathbb{C}',
    '\\QQ': '\\mathbb{Q}',
  },
  fleqn: false,
  leqno: false,
  output: 'html',
  displayMode: true,
  errorColor: '#cc0000',
  minRuleThickness: 0.05,
  maxSize: Infinity,
  maxExpand: 1000,
  globalGroup: true,
  allowedEnvironments: [
    'matrix',
    'pmatrix',
    'bmatrix',
    'Bmatrix',
    'vmatrix',
    'Vmatrix',
    'equation',
    'equation*',
    'align',
    'align*',
    'gather',
    'gather*',
    'cases',
    'array',
    'split',
  ],
}

export function MarkdownRenderer({ children }: { children: string }) {
  const components: Components = {
    ...COMPONENTS,
    span: ({
      className,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      node,
      ...props
    }) => {
      // 只处理 katex 类，不管是块级还是行内
      if (className === "katex") {
        return (
          <MarkdownMathWrapper>
            <span className={className} {...props} />
          </MarkdownMathWrapper>
        );
      }

      return <span className={className} {...props} />;
    },
  };

  return (
    <Markdown
      remarkPlugins={[
        remarkGfm,
        remarkHighlight,
        [remarkMath, { singleDollar: true, doubleBackslash: true }],
      ]}
      rehypePlugins={[
        [
          rehypeKatex,
          {
            ...katexOptions,
            output: 'htmlAndMathml',
            trust: true,
            strict: false,
            throwOnError: true,
          },
        ],
      ]}
      components={components}
    >
      {processLaTeX(children)}
    </Markdown>
  )
}

function remarkHighlight() {
  return (tree: any) => {
    visit(tree, "text", (node, index, parent) => {
      const matches = Array.from(
        node.value.matchAll(/==(.*?)==/g),
      ) as Array<RegExpMatchArray>;
      if (!matches.length) return;

      const children: any[] = [];
      let lastIndex = 0;

      matches.forEach((match: RegExpMatchArray) => {
        const beforeText = node.value.slice(lastIndex, match.index);
        if (beforeText) {
          children.push({ type: "text", value: beforeText });
        }

        children.push({
          type: "highlight",
          data: { hName: "mark" },
          children: [{ type: "text", value: match[1] }],
        });

        lastIndex = (match.index ?? 0) + match[0].length;
      });

      const afterText = node.value.slice(lastIndex);
      if (afterText) {
        children.push({ type: "text", value: afterText });
      }

      parent.children.splice(index, 1, ...children);
    });
  };
}

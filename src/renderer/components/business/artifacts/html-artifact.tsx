import type React from "react";
import { useEffect, useRef } from "react";
import logger from "@shared/logger/renderer-logger";

interface HtmlPreviewProps {
  content: string;
  isPreview?: boolean;
}

export const HtmlPreview: React.FC<HtmlPreviewProps> = ({
  content,
  isPreview = true,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isPreview && iframeRef.current) {
      const iframe = iframeRef.current;

      iframe.onload = () => {
        try {
          const iframeDoc = iframe.contentDocument;
          if (!iframeDoc) return;

          // 添加重置CSS样式
          const resetCSS = `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              height: 100%;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              background: #fff;
            }
            img {
              max-width: 100%;
              height: auto;
              display: block;
            }
            a {
              color: #0066cc;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            pre, code {
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              background: #f5f5f5;
              padding: 0.2em 0.4em;
              border-radius: 3px;
            }
            pre {
              padding: 1em;
              overflow-x: auto;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 0.5em;
              text-align: left;
            }
            th {
              background: #f5f5f5;
              font-weight: bold;
            }
            blockquote {
              border-left: 4px solid #ddd;
              margin: 1em 0;
              padding-left: 1em;
              color: #666;
            }
            h1, h2, h3, h4, h5, h6 {
              margin: 1em 0 0.5em 0;
              line-height: 1.2;
            }
            p {
              margin: 0.5em 0;
            }
            ul, ol {
              margin: 0.5em 0;
              padding-left: 2em;
            }
          `;

          // 创建并添加样式元素
          const styleElement = iframeDoc.createElement("style");
          styleElement.textContent = resetCSS;

          // 确保head存在
          if (!iframeDoc.head) {
            const head = iframeDoc.createElement("head");
            iframeDoc.documentElement.appendChild(head);
          }

          iframeDoc.head.appendChild(styleElement);
        } catch (error) {
          logger.warn("HtmlArtifact: Failed to apply styles to iframe", {
            error,
          });
        }
      };
    }
  }, [isPreview]);

  return (
    <div className="h-full w-full overflow-auto bg-white dark:bg-gray-900">
      <iframe
        ref={iframeRef}
        srcDoc={content}
        className="h-full min-h-[400px] w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title="HTML Preview"
        style={{
          background: "white",
        }}
      />
    </div>
  );
};

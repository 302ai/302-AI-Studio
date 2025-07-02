import type React from "react";
import { useEffect, useRef, useState } from "react";

interface SvgArtifactProps {
  block: {
    artifact: {
      type: string;
      title: string;
    };
    content: string;
  };
  isPreview?: boolean;
}

const SvgArtifact: React.FC<SvgArtifactProps> = ({
  block,
  isPreview = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!isPreview || !containerRef.current) return;

    try {
      // 验证SVG内容
      const parser = new DOMParser();
      const doc = parser.parseFromString(block.content, "image/svg+xml");
      const parserError = doc.querySelector("parsererror");

      if (parserError) {
        setError("Invalid SVG format");
        return;
      }

      // 清理容器
      containerRef.current.innerHTML = "";

      // 创建SVG元素
      const svgElement = doc.documentElement.cloneNode(true) as SVGElement;

      // 确保SVG有适当的样式
      svgElement.style.maxWidth = "100%";
      svgElement.style.height = "auto";
      svgElement.style.display = "block";
      svgElement.style.margin = "0 auto";

      // 如果SVG没有viewBox，尝试设置一个
      if (
        !svgElement.getAttribute("viewBox") &&
        svgElement.getAttribute("width") &&
        svgElement.getAttribute("height")
      ) {
        const width = svgElement.getAttribute("width");
        const height = svgElement.getAttribute("height");
        svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }

      containerRef.current.appendChild(svgElement);
      setError("");
    } catch (err) {
      console.error("SVG rendering error:", err);
      setError(err instanceof Error ? err.message : "Failed to render SVG");
    }
  }, [block.content, isPreview]);

  if (!isPreview) {
    return (
      <div className="h-full p-4">
        <pre className="h-full overflow-auto rounded-lg bg-muted p-4 font-mono text-sm">
          <code>{block.content}</code>
        </pre>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="rounded-lg bg-red-50 p-4 text-red-500 dark:bg-red-900/20">
          <p className="font-medium">SVG Rendering Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-4">
      <div
        ref={containerRef}
        className="flex max-h-full max-w-full items-center justify-center"
      />
    </div>
  );
};

export default SvgArtifact;

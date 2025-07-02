import { Editor } from "@monaco-editor/react";
import { useRef } from "react";

interface CodeArtifactProps {
  code: string;
  language: string;
}

const CodeArtifact = ({ code, language }: CodeArtifactProps) => {
  const codeEditorRef = useRef<HTMLDivElement>(null);

  return (
    <div className="m-4 h-full overflow-hidden rounded-lg ">
      <div
        ref={codeEditorRef}
        className="h-full overflow-auto bg-background p-3 font-mono text-xs leading-relaxed"
      >
        <CodeRenderer content={code} language={language} />
      </div>
    </div>
  );
};

const getMonacoLanguage = (lang: string): string => {
  const normalizedLang = lang?.trim().toLowerCase() || "";

  const languageMap: Record<string, string> = {
    html: "html",
    react: "javascript",
    jsx: "javascript",
    tsx: "typescript",
    svg: "xml",
    text: "plaintext",
    txt: "plaintext",
  };

  return languageMap[normalizedLang];
};

const CodeRenderer = ({
  content,
  language,
}: {
  content: string;
  language: string;
}) => {
  const monacoLanguage = getMonacoLanguage(language);

  return (
    <Editor
      height="100%"
      language={monacoLanguage}
      theme={"vs-dark"}
      value={content}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        lineNumbers: "on",
        folding: true,
        selectOnLineNumbers: true,
        automaticLayout: true,
        fontSize: 12,
        fontFamily:
          "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
      }}
    />
  );
};

export default CodeArtifact;

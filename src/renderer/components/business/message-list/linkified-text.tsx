import Linkify from "linkify-react";

const { shellService } = window.service;

interface LinkifiedTextProps {
  text: string;
}

export function LinkifiedText({ text }: LinkifiedTextProps) {
  const handleLinkClick = (href: string) => {
    console.log("Opening external link:", href);
    shellService.openExternal(href);
  };

  // 验证URL是否为有效链接
  const validateUrl = (value: string, type: string) => {
    if (type === "url") {
      try {
        new URL(value.startsWith("http") ? value : `http://${value}`);
        return true;
      } catch (_error) {
        return false;
      }
    }
    return false;
  };

  return (
    <Linkify
      options={{
        validate: validateUrl,
        render({ attributes, content }) {
          return (
            <a
              href={attributes.href}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer font-medium hover:underline"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(attributes.href);
              }}
            >
              {content}
            </a>
          );
        },
      }}
    >
      {text}
    </Linkify>
  );
}

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
      const hasProtocol = /^https?:\/\//i.test(value);
      const isDomainLike = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(value);
      const isValidDomain =
        /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/i.test(value) &&
        value.split(".").length >= 2 &&
        value.split(".")[0].length > 1 &&
        !value.match(/\.(data|txt|log|tmp|temp|bak|old)$/i);

      return hasProtocol || (isDomainLike && isValidDomain);
    }
    return true;
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
              className="cursor-pointer font-medium text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
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

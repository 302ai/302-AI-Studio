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

  return (
    <Linkify
      options={{
        // onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        //   event.preventDefault();
        //   event.stopPropagation();
        //   const href = event.currentTarget.href;
        //   console.log("Link clicked:", href);
        //   handleLinkClick(href);
        //   return false;
        // },
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

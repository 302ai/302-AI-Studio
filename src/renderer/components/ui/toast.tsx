import { triplitClient } from "@renderer/client";
import { useQueryOne } from "@triplit/react";
import { Toaster as ToasterPrimitive, type ToasterProps } from "sonner";

const Toast = ({ ...props }: ToasterProps) => {
  const settingsQuery = triplitClient.query("settings");
  const { result: settingsResult } = useQueryOne(triplitClient, settingsQuery);
  const theme = settingsResult?.theme ?? "system";

  return (
    <ToasterPrimitive
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      toastOptions={{
        className:
          "*:data-icon:self-start font-sans has-data-description:*:data-icon:mt-1 *:data-icon:mt-0.5 backdrop-blur-2xl",
      }}
      style={
        {
          "--normal-bg": "var(--color-overlay)",
          "--normal-text": "var(--color-overlay-fg)",
          "--normal-border": "var(--color-border)",

          "--success-bg": "var(--color-success-bg)",
          "--success-border": "var(--color-success-border)",
          "--success-text": "var(--color-success-text)",

          "--error-bg": "var(--color-error-bg)",
          "--error-border": "var(--color-error-border)",
          "--error-text": "var(--color-error-text)",

          "--warning-bg": "var(--color-warning-bg)",
          "--warning-border": "var(--color-warning-border)",
          "--warning-text": "var(--color-warning-text)",

          "--info-bg": "var(--color-info-bg)",
          "--info-border": "var(--color-info-border)",
          "--info-text": "var(--color-info-text)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export type { ToasterProps };
export { Toast };

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
        classNames: {
          toast: "toast border-0! inset-ring! inset-ring-fg/10!",
          title: "title",
          description: "description",
          actionButton: "bg-primary! hover:bg-primary/90! text-primary-fg!",
          cancelButton:
            "bg-transparent! hover:bg-secondary! hover:text-secondary-fg!",
          closeButton: "close-button",
        },
      }}
      {...props}
    />
  );
};

export type { ToasterProps };
export { Toast };

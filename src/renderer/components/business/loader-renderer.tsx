import { cn } from "@renderer/lib/utils";

type StatusConfig = { text?: string; icon?: React.ReactNode };

type StatusKeys<T> = T extends {
  [K in keyof T]: StatusConfig;
}
  ? keyof T
  : never;

type LoaderRendererProps<T extends Record<string, StatusConfig>> = {
  className?: string;
  status: StatusKeys<T>;
  statuses: T;
};

export const LoaderRenderer = <T extends Record<string, StatusConfig>>({
  status,
  statuses,
  className,
}: LoaderRendererProps<T>) => {
  const statusConfig = statuses[status];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {statusConfig?.icon && <>{statusConfig.icon}</>}
      {statusConfig?.text && <>{statusConfig.text}</>}
    </div>
  );
};

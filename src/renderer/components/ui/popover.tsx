import type {
  DialogProps,
  DialogTriggerProps,
  ModalOverlayProps,
  PopoverProps as PopoverPrimitiveProps,
} from "react-aria-components";
import {
  DialogTrigger,
  OverlayArrow,
  PopoverContext,
  Popover as PopoverPrimitive,
  composeRenderProps,
  useSlottedContext,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { twMerge } from "tailwind-merge";
import type {
  DialogBodyProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogTitleProps,
} from "./dialog";
import { Dialog } from "./dialog";

type PopoverProps = DialogTriggerProps;
const Popover = (props: PopoverProps) => {
  return <DialogTrigger {...props} />;
};

const PopoverTitle = ({ level = 2, className, ...props }: DialogTitleProps) => (
  <Dialog.Title
    className={twMerge(
      "sm:leading-none",
      level === 2 && "sm:text-lg",
      className,
    )}
    {...props}
  />
);

const PopoverHeader = ({ className, ...props }: DialogHeaderProps) => (
  <Dialog.Header className={twMerge("sm:p-4", className)} {...props} />
);

const PopoverFooter = ({ className, ...props }: DialogFooterProps) => (
  <Dialog.Footer className={twMerge("sm:p-4", className)} {...props} />
);

const PopoverBody = ({ className, ref, ...props }: DialogBodyProps) => (
  <Dialog.Body
    ref={ref}
    className={twMerge("sm:px-4 sm:pt-0", className)}
    {...props}
  />
);

const content = tv({
  base: [
    "peer/popover-content max-w-xs rounded-xl border bg-overlay bg-clip-padding text-overlay-fg shadow-xs transition-transform [scrollbar-width:thin] sm:max-w-3xl sm:text-sm dark:backdrop-saturate-200 forced-colors:bg-[Canvas] [&::-webkit-scrollbar]:size-0.5",
  ],
  variants: {
    isPicker: {
      true: "max-h-72 min-w-(--trigger-width) overflow-y-auto",
      false: "min-w-80",
    },
    isMenu: {
      true: "",
    },
    isEntering: {
      true: [
        "fade-in animate-in duration-150 ease-out",
        "data-[placement=left]:slide-in-from-right-1 data-[placement=right]:slide-in-from-left-1 data-[placement=top]:slide-in-from-bottom-1 data-[placement=bottom]:slide-in-from-top-1",
      ],
    },
    isExiting: {
      true: [
        "fade-out animate-out duration-100 ease-in",
        "data-[placement=left]:slide-out-to-right-1 data-[placement=right]:slide-out-to-left-1 data-[placement=top]:slide-out-to-bottom-1 data-[placement=bottom]:slide-out-to-top-1",
      ],
    },
  },
});

interface PopoverContentProps
  extends Omit<PopoverPrimitiveProps, "children" | "className">,
    Omit<ModalOverlayProps, "className">,
    Pick<DialogProps, "aria-label" | "aria-labelledby"> {
  children: React.ReactNode;
  showArrow?: boolean;
  style?: React.CSSProperties;
  respectScreen?: boolean;
  className?: string | ((values: { defaultClassName?: string }) => string);
}

const PopoverContent = ({
  respectScreen = true,
  children,
  showArrow = true,
  className,
  ...props
}: PopoverContentProps) => {
  const popoverContext = useSlottedContext(PopoverContext);
  const isSubmenuTrigger = popoverContext?.trigger === "SubmenuTrigger";
  const isComboBoxTrigger = popoverContext?.trigger === "ComboBox";
  const offset = showArrow ? 12 : 8;
  const effectiveOffset = isSubmenuTrigger ? offset - 5 : offset;
  return (
    <PopoverPrimitive
      offset={effectiveOffset}
      className={composeRenderProps(className, (className, renderProps) =>
        content({
          ...renderProps,
          className,
        }),
      )}
      {...props}
    >
      {showArrow && (
        <OverlayArrow className="group">
          <svg
            role="presentation"
            aria-hidden="true"
            width={12}
            height={12}
            viewBox="0 0 12 12"
            className="group-data-[placement=left]:-rotate-90 block fill-overlay stroke-border group-data-[placement=bottom]:rotate-180 group-data-[placement=right]:rotate-90 forced-colors:fill-[Canvas] forced-colors:stroke-[ButtonBorder]"
          >
            <path d="M0 0 L6 6 L12 0" />
          </svg>
        </OverlayArrow>
      )}
      {!isComboBoxTrigger ? (
        <Dialog role="dialog" aria-label={props["aria-label"] ?? "List item"}>
          {children}
        </Dialog>
      ) : (
        children
      )}
    </PopoverPrimitive>
  );
};

const PopoverTrigger = Dialog.Trigger;
const PopoverClose = Dialog.Close;
const PopoverDescription = Dialog.Description;

Popover.Trigger = PopoverTrigger;
Popover.Close = PopoverClose;
Popover.Description = PopoverDescription;
Popover.Content = PopoverContent;
Popover.Body = PopoverBody;
Popover.Footer = PopoverFooter;
Popover.Header = PopoverHeader;
Popover.Title = PopoverTitle;

export type { PopoverProps, PopoverContentProps };
export { Popover, PopoverContent };

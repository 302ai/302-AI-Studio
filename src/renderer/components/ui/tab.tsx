import { composeTailwindRenderProps } from "@renderer/lib/primitive";

import { LayoutGroup, motion } from "motion/react";
import { useId } from "react";
import type {
  TabListProps as TabListPrimitiveProps,
  TabPanelProps as TabPanelPrimitiveProps,
  TabProps as TabPrimitiveProps,
  TabsProps as TabsPrimitiveProps,
} from "react-aria-components";
import {
  composeRenderProps,
  TabList as TabListPrimitive,
  TabPanel as TabPanelPrimitive,
  Tab as TabPrimitive,
  Tabs as TabsPrimitive,
} from "react-aria-components";
import { twJoin, twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

const tabsStyles = tv({
  base: "group/tabs flex gap-4 forced-color-adjust-none",
  variants: {
    orientation: {
      horizontal: "flex-col",
      vertical: "w-[800px] flex-row",
    },
  },
});

interface TabsProps extends TabsPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>;
}
const Tabs = ({ className, ref, ...props }: TabsProps) => {
  return (
    <TabsPrimitive
      className={composeRenderProps(className, (className, renderProps) =>
        tabsStyles({
          ...renderProps,
          className,
        })
      )}
      ref={ref}
      {...props}
    />
  );
};

const tabListStyles = tv({
  base: "flex forced-color-adjust-none",
  variants: {
    orientation: {
      horizontal: "flex-row gap-x-5 border-border border-b",
      vertical: "flex-col items-start border-l",
    },
  },
});

interface TabListProps<T extends object> extends TabListPrimitiveProps<T> {
  ref?: React.RefObject<HTMLDivElement>;
}
const TabList = <T extends object>({
  className,
  ref,
  ...props
}: TabListProps<T>) => {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <TabListPrimitive
        ref={ref}
        {...props}
        className={composeRenderProps(className, (className, renderProps) =>
          tabListStyles({ ...renderProps, className })
        )}
      />
    </LayoutGroup>
  );
};

const tabStyles = tv({
  base: [
    "relative flex cursor-default items-center whitespace-nowrap rounded-lg font-medium text-sm outline-hidden transition *:data-[slot=icon]:mr-2 *:data-[slot=icon]:size-4",
    "group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:py-2 group-data-[orientation=vertical]/tabs:px-4",
    "group-data-[orientation=horizontal]/tabs:pb-3",
  ],
  variants: {
    isSelected: {
      false: "text-setting-tab-list-fg hover:bg-hover-primary",
      true: "text-accent-fg bg-accent hover:bg-accent",
    },
    isFocused: {
      false: "ring-0",
      true: "text-accent-fg",
    },
    isDisabled: {
      true: "text-muted-fg/50 hover:bg-transparent",
    },
  },
});

interface TabProps extends TabPrimitiveProps {
  ref?: React.RefObject<HTMLButtonElement>;
}
const Tab = ({ children, ref, ...props }: TabProps) => {
  return (
    <TabPrimitive
      ref={ref}
      {...props}
      className={composeRenderProps(
        props.className,
        (_className, renderProps) =>
          tabStyles({
            ...renderProps,
            className: twJoin("href" in props && "cursor-pointer", _className),
          })
      )}
    >
      {({ isSelected }) => (
        <>
          {children as React.ReactNode}
          {isSelected && (
            <motion.span
              data-slot="selected-indicator"
              className={twMerge(
                "absolute rounded bg-primary",
                // horizontal
                "group-data-[orientation=horizontal]/tabs:-bottom-px group-data-[orientation=horizontal]/tabs:inset-x-0 group-data-[orientation=horizontal]/tabs:h-0.5 group-data-[orientation=horizontal]/tabs:w-full",
                // vertical
                "group-data-[orientation=vertical]/tabs:right-[-12px] group-data-[orientation=vertical]/tabs:h-[calc(50%)] group-data-[orientation=vertical]/tabs:w-[3px] group-data-[orientation=vertical]/tabs:transform group-data-[orientation=vertical]/tabs:rounded-r-[2px]"
              )}
              layoutId="current-selected"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          )}
        </>
      )}
    </TabPrimitive>
  );
};

interface TabPanelProps extends TabPanelPrimitiveProps {
  ref?: React.RefObject<HTMLDivElement>;
}
const TabPanel = ({ className, ref, ...props }: TabPanelProps) => {
  return (
    <TabPanelPrimitive
      {...props}
      ref={ref}
      className={composeTailwindRenderProps(
        className,
        "flex-1 text-fg text-sm focus-visible:outline-hidden"
      )}
    />
  );
};

export type { TabsProps, TabListProps, TabProps, TabPanelProps };
export { Tabs, TabList, Tab, TabPanel };

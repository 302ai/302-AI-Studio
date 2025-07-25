import { IconSearch, IconX } from "@intentui/icons";
import { composeTailwindRenderProps } from "@renderer/lib/primitive";
import { cn } from "@renderer/lib/utils";
import type { SearchFieldProps as SearchFieldPrimitiveProps } from "react-aria-components";
import {
  Button,
  SearchField as SearchFieldPrimitive,
} from "react-aria-components";
import {
  Description,
  FieldError,
  FieldGroup,
  type FieldProps,
  Input,
  Label,
} from "./field";
import { Loader } from "./loader";

interface SearchFieldProps extends SearchFieldPrimitiveProps, FieldProps {
  isPending?: boolean;
}

const SearchField = ({
  children,
  className,
  placeholder,
  label,
  description,
  errorMessage,
  isPending,
  ...props
}: SearchFieldProps) => {
  return (
    <SearchFieldPrimitive
      aria-label={placeholder ?? props["aria-label"] ?? "Search..."}
      {...props}
      className={composeTailwindRenderProps(
        className,
        "group/search-field relative flex flex-col gap-y-1 *:data-[slot=label]:font-medium",
      )}
    >
      {(values) => (
        <>
          {label && <Label>{label}</Label>}
          {typeof children === "function" ? (
            children(values)
          ) : children ? (
            children
          ) : (
            <FieldGroup className={cn(className)}>
              {isPending ? <Loader variant="spin" /> : <IconSearch />}
              <Input placeholder={placeholder ?? "Search..."} />

              <Button className="grid place-content-center pressed:text-fg text-muted-fg hover:text-fg group-empty/search-field:invisible">
                <IconX />
              </Button>
            </FieldGroup>
          )}

          {description && <Description>{description}</Description>}
          <FieldError>{errorMessage}</FieldError>
        </>
      )}
    </SearchFieldPrimitive>
  );
};

export type { SearchFieldProps };
export { SearchField };

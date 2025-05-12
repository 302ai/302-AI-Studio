import {
  TextArea as TextAreaPrimitive,
  TextField as TextFieldPrimitive,
  type TextFieldProps as TextFieldPrimitiveProps,
  type ValidationResult,
  composeRenderProps,
} from "react-aria-components";
import { tv } from "tailwind-variants";

import {
  composeTailwindRenderProps,
  focusStyles,
} from "@renderer/lib/primitive";
import { Description, FieldError, Label } from "./field";

const textareaStyles = tv({
  extend: focusStyles,
  base: "field-sizing-content max-h-96 min-h-16 w-full min-w-0 border border-input px-2.5 py-2 text-base shadow-xs outline-hidden transition duration-200 disabled:opacity-50 sm:text-sm",
});

interface TextareaProps extends TextFieldPrimitiveProps {
  autoSize?: boolean;
  label?: string;
  placeholder?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  className?: string;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = ({
  className,
  placeholder,
  label,
  description,
  errorMessage,
  resize = "vertical",
  ...props
}: TextareaProps) => {
  return (
    <TextFieldPrimitive
      {...props}
      className={composeTailwindRenderProps(
        className,
        "group flex flex-col gap-y-1.5",
      )}
    >
      {label && <Label>{label}</Label>}
      <TextAreaPrimitive
        placeholder={placeholder}
        className={composeRenderProps(className, (className, renderProps) =>
          textareaStyles({
            ...renderProps,
            className,
          }),
        )}
        style={{
          resize: resize,
          scrollbarGutter: "stable",
        }}
      />
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </TextFieldPrimitive>
  );
};

export type { TextareaProps };
export { Textarea };

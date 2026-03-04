import type { InputHTMLAttributes } from "react";
import clsx from "clsx";
import { ksClasses } from "../design/tokens";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...rest }: InputProps) => {
  return (
    <input
      className={clsx(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text",
        "placeholder:text-text-muted",
        ksClasses.focusRing,
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...rest}
    />
  );
};

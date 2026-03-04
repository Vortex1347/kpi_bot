import type { SelectHTMLAttributes } from "react";
import clsx from "clsx";
import { ksClasses } from "../design/tokens";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = ({ className, ...rest }: SelectProps) => {
  return (
    <select
      className={clsx(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text",
        ksClasses.focusRing,
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...rest}
    />
  );
};

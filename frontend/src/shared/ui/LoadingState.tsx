import type { HTMLAttributes } from "react";
import clsx from "clsx";

interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly label?: string;
}

export const LoadingState = ({ label = "Загрузка...", className, ...rest }: LoadingStateProps) => {
  return (
    <div role="status" aria-live="polite" className={clsx("text-sm text-text-muted", className)} {...rest}>
      {label}
    </div>
  );
};

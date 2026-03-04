import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
}

export const EmptyState = ({ title, description, action, className, ...rest }: EmptyStateProps) => {
  return (
    <div className={clsx("rounded-lg border border-dashed border-border bg-surface p-6 text-center", className)} {...rest}>
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {description ? <p className="mt-2 text-sm text-text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};

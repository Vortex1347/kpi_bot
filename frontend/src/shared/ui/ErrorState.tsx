import type { HTMLAttributes } from "react";
import clsx from "clsx";
import { ksClasses } from "../design/tokens";

interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly message: string;
}

export const ErrorState = ({ message, className, ...rest }: ErrorStateProps) => {
  return (
    <div role="alert" className={clsx(ksClasses.errorAlert, className)} {...rest}>
      {message}
    </div>
  );
};

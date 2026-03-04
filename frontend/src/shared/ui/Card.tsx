import type { ElementType, HTMLAttributes } from "react";
import clsx from "clsx";
import { ksClasses } from "../design/tokens";

interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly as?: ElementType;
}

export const Card = ({ as, className, ...rest }: CardProps) => {
  const Component = as ?? "div";

  return <Component className={clsx(ksClasses.card, className)} {...rest} />;
};

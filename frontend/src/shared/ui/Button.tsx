import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { ksClasses } from "../design/tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-primary-600 bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
  secondary: "border-border bg-surface-2 text-text hover:bg-surface active:bg-bg",
  ghost: "border-transparent bg-transparent text-text hover:bg-surface active:bg-surface-2",
  danger: "border-error bg-error text-white hover:bg-error/90 active:bg-error/80"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base"
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading,
  className,
  disabled,
  type,
  ...rest
}: ButtonProps) => {
  return (
    <button
      type={type ?? "button"}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md border font-semibold",
        `transition-colors duration-150 ${ksClasses.focusRing}`,
        "disabled:cursor-not-allowed disabled:opacity-70",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? "Загрузка..." : children}
    </button>
  );
};

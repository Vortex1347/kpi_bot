import type { ReactNode } from "react";
import { ksClasses } from "../design/tokens";

interface AuthLayoutProps {
  readonly children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className={ksClasses.page}>
      <div className={ksClasses.authContainer}>
        <main className="flex-1 flex items-center">{children}</main>
        <footer className="mt-8 border-t border-border pt-4 text-xs text-text-muted">
          KPI CRM · auth
        </footer>
      </div>
    </div>
  );
};

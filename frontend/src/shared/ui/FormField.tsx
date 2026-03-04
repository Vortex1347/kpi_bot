import type { ReactNode } from "react";

interface FormFieldProps {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string | null;
  readonly children: ReactNode;
}

export const FormField = ({ label, hint, error, children }: FormFieldProps) => {
  return (
    <label className="block space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-text">{label}</span>
        {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      </div>
      {children}
      {error ? <div className="text-xs text-error">{error}</div> : null}
    </label>
  );
};

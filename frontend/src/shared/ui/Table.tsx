import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
  ReactNode
} from "react";
import clsx from "clsx";
import { ksClasses } from "../design/tokens";

interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

export const TableContainer = ({ className, children, ...rest }: TableContainerProps) => {
  return (
    <div className={clsx("overflow-hidden", ksClasses.card, className)} {...rest}>
      {children}
    </div>
  );
};

type DataTableProps = TableHTMLAttributes<HTMLTableElement>;

export const DataTable = ({ className, ...rest }: DataTableProps) => {
  return <table className={clsx("w-full border-collapse text-left text-sm", className)} {...rest} />;
};

type DataTableSectionProps = HTMLAttributes<HTMLTableSectionElement>;

export const DataTableHead = ({ className, ...rest }: DataTableSectionProps) => {
  return <thead className={clsx("bg-surface", className)} {...rest} />;
};

export const DataTableBody = ({ className, ...rest }: DataTableSectionProps) => {
  return <tbody className={clsx("divide-y divide-border bg-bg", className)} {...rest} />;
};

type DataTableRowProps = HTMLAttributes<HTMLTableRowElement>;

export const DataTableRow = ({ className, ...rest }: DataTableRowProps) => {
  return <tr className={clsx("align-top", className)} {...rest} />;
};

type DataTableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement>;

export const DataTableHeaderCell = ({ className, ...rest }: DataTableHeaderCellProps) => {
  return <th className={clsx("px-3 py-3 font-medium text-text-muted", className)} {...rest} />;
};

type DataTableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

export const DataTableCell = ({ className, ...rest }: DataTableCellProps) => {
  return <td className={clsx("px-3 py-3", className)} {...rest} />;
};

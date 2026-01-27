"use client";

import React from "react";

export type AdminTableColumn<T> = {
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

export type AdminTableProps<T> = {
  data: T[];
  columns: Array<AdminTableColumn<T>>;
  getRowKey: (row: T, index: number) => string;
  enableSelection?: boolean;
  selectedRowKeys?: string[];
  onSelectedRowKeysChange?: (keys: string[]) => void;
  isRowSelectable?: (row: T, index: number) => boolean;
  loading?: boolean;
  loadingNode?: React.ReactNode;
  emptyNode?: React.ReactNode;
  wrapperClassName?: string;
  tableClassName?: string;
  theadClassName?: string;
  tbodyClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
};

export default function AdminTable<T>({
  data,
  columns,
  getRowKey,
  enableSelection = false,
  selectedRowKeys,
  onSelectedRowKeysChange,
  isRowSelectable,
  loading = false,
  loadingNode,
  emptyNode,
  wrapperClassName,
  tableClassName,
  theadClassName,
  tbodyClassName,
  rowClassName,
}: AdminTableProps<T>) {
  const selectedSet = React.useMemo(() => new Set(selectedRowKeys || []), [selectedRowKeys]);

  const selectableRowKeys = React.useMemo(() => {
    if (!enableSelection) return [];
    return data
      .map((row, index) => {
        const key = getRowKey(row, index);
        const selectable = isRowSelectable ? isRowSelectable(row, index) : true;
        return selectable ? key : null;
      })
      .filter((k): k is string => typeof k === "string");
  }, [data, enableSelection, getRowKey, isRowSelectable]);

  const allSelected =
    enableSelection &&
    selectableRowKeys.length > 0 &&
    selectableRowKeys.every((k) => selectedSet.has(k));

  const someSelected =
    enableSelection &&
    selectableRowKeys.some((k) => selectedSet.has(k)) &&
    !allSelected;

  const headerCheckboxRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (!headerCheckboxRef.current) return;
    headerCheckboxRef.current.indeterminate = !!someSelected;
  }, [someSelected]);

  if (loading) {
    const node = loadingNode || null;
    if (wrapperClassName) return <div className={wrapperClassName}>{node}</div>;
    return <>{node}</>;
  }

  if (!data || data.length === 0) {
    const node = emptyNode || null;
    if (wrapperClassName) return <div className={wrapperClassName}>{node}</div>;
    return <>{node}</>;
  }

  const handleToggleAll = () => {
    if (!onSelectedRowKeysChange) return;
    if (allSelected) {
      const next = (selectedRowKeys || []).filter((k) => !selectableRowKeys.includes(k));
      onSelectedRowKeysChange(next);
      return;
    }

    const merged = new Set([...(selectedRowKeys || []), ...selectableRowKeys]);
    onSelectedRowKeysChange(Array.from(merged));
  };

  const handleToggleRow = (key: string) => {
    if (!onSelectedRowKeysChange) return;
    const next = new Set(selectedRowKeys || []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectedRowKeysChange(Array.from(next));
  };

  const table = (
    <table className={tableClassName}>
      <thead className={theadClassName}>
        <tr>
          {enableSelection && (
            <th className="w-12 px-4 py-3">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleAll}
                disabled={!onSelectedRowKeysChange || selectableRowKeys.length === 0}
              />
            </th>
          )}
          {columns.map((col, idx) => (
            <th key={idx} className={col.headerClassName}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={tbodyClassName}>
        {data.map((row, index) => {
          const cls = typeof rowClassName === "function" ? rowClassName(row, index) : rowClassName;
          const key = getRowKey(row, index);
          const selectable = isRowSelectable ? isRowSelectable(row, index) : true;

          return (
            <tr key={key} className={cls}>
              {enableSelection && (
                <td className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedSet.has(key)}
                    onChange={() => handleToggleRow(key)}
                    disabled={!selectable || !onSelectedRowKeysChange}
                  />
                </td>
              )}
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={col.cellClassName}>
                  {col.render(row, index)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  if (wrapperClassName) {
    return <div className={wrapperClassName}>{table}</div>;
  }

  return table;
}

"use client";

import React, { useMemo } from "react";

import { cn } from "@/lib/utils";

export default function MiniBarChart({
  values,
  labels,
  barClassName,
}: {
  values: number[];
  labels?: string[];
  barClassName?: string;
}) {
  const max = useMemo(() => {
    const m = values.length ? Math.max(...values) : 0;
    return m <= 0 ? 1 : m;
  }, [values]);

  const tickLabels = useMemo(() => {
    if (!labels || labels.length === 0) return null;
    const first = labels[0] ?? "";
    const mid = labels[Math.floor((labels.length - 1) / 2)] ?? "";
    const last = labels[labels.length - 1] ?? "";
    return { first, mid, last };
  }, [labels]);

  return (
    <div className="space-y-2">
      <div className="grid h-20 grid-cols-14 items-end gap-1">
        {values.map((v, idx) => {
          const pct = Math.max(0, Math.min(100, Math.round((v / max) * 100)));
          return (
            <div key={idx} className="flex h-full flex-col justify-end">
              <div
                className={cn("w-full rounded-sm", barClassName ?? "bg-primary/70")}
                style={{ height: `${pct}%` }}
                title={labels?.[idx] ? `${labels[idx]}: ${v}` : String(v)}
              />
            </div>
          );
        })}
      </div>

      {tickLabels ? (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{tickLabels.first}</span>
          <span>{tickLabels.mid}</span>
          <span>{tickLabels.last}</span>
        </div>
      ) : null}
    </div>
  );
}

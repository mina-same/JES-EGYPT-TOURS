"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type Tone = "blue" | "emerald" | "amber" | "violet" | "rose";

const toneClasses: Record<Tone, { icon: string; bg: string }> = {
  blue: { icon: "text-blue-600", bg: "bg-blue-50" },
  emerald: { icon: "text-emerald-600", bg: "bg-emerald-50" },
  amber: { icon: "text-amber-600", bg: "bg-amber-50" },
  violet: { icon: "text-violet-600", bg: "bg-violet-50" },
  rose: { icon: "text-rose-600", bg: "bg-rose-50" },
};

export default function DashboardKpiCard({
  icon: Icon,
  label,
  value,
  tone = "blue",
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  tone?: Tone;
  onClick?: () => void;
}) {
  const t = toneClasses[tone];

  const card = (
    <Card
      className={
        onClick
          ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md"
          : undefined
      }
      onClick={onClick}
    >
      <CardContent className="flex items-start gap-3 p-5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.bg}`}
        >
          <Icon className={t.icon} size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold leading-none tracking-tight">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return card;
}

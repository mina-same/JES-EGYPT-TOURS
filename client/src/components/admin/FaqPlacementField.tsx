"use client";

import React from "react";
import { Home, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Where a FAQ appears — the homepage short list, or the /faq page.
 *
 * A question belongs to exactly ONE of them: the FAQ page deliberately excludes
 * anything shown on the homepage, so the two lists never repeat each other.
 *
 * This replaces a "Display on Home" switch, which read as "show it here TOO"
 * while it actually MOVED the question off the FAQ page. Flipping it on every
 * question silently emptied /faq with nothing on screen to explain why. The
 * field stores the same boolean; only the question it asks has changed.
 */
export default function FaqPlacementField({
  value,
  onChange,
}: {
  /** true = homepage, false = /faq page. */
  value: boolean;
  onChange: (onHome: boolean) => void;
}) {
  const options = [
    {
      onHome: true,
      icon: Home,
      title: "Home page",
      hint: "The short list of highlights on the homepage",
    },
    {
      onHome: false,
      icon: HelpCircle,
      title: "FAQ page",
      hint: "The full page at /faq",
    },
  ];

  return (
    <div className="space-y-2">
      <Label>Where does this question appear?</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const selected = value === option.onHome;
          const Icon = option.icon;
          return (
            <button
              key={option.title}
              type="button"
              onClick={() => onChange(option.onHome)}
              aria-pressed={selected}
              className={cn(
                "flex items-start gap-3 rounded-md border p-3 text-left transition-colors",
                selected
                  ? "border-[#b79c5c] bg-[#b79c5c]/10"
                  : "border-gray-200 hover:border-[#b79c5c]/60 dark:border-slate-700"
              )}
            >
              <Icon
                size={18}
                className={cn("mt-0.5 shrink-0", selected ? "text-[#b79c5c]" : "text-gray-400")}
              />
              <span>
                <span className="block text-sm font-semibold">{option.title}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        A question appears in one place only — the FAQ page leaves out whatever the
        homepage already shows, so the two never repeat.
      </p>
    </div>
  );
}

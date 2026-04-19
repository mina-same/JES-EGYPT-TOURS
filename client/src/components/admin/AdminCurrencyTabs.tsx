"use client";

import React from "react";
import { US, EU, GB } from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";

export type AdminCurrency = "USD" | "EUR" | "GBP";

interface AdminCurrencyTabsProps {
  activeCurrency: AdminCurrency;
  onCurrencyChange: (currency: AdminCurrency) => void;
  className?: string;
  compact?: boolean;
}

const CURRENCIES: { id: AdminCurrency; label: string; Icon: any }[] = [
  { id: "USD", label: "US Dollar", Icon: US },
  { id: "EUR", label: "Euro", Icon: EU },
  { id: "GBP", label: "Pound Sterling", Icon: GB },
];

const AdminCurrencyTabs: React.FC<AdminCurrencyTabsProps> = ({
  activeCurrency,
  onCurrencyChange,
  className = "",
  compact = false,
}) => {
  return (
    <div className={cn(
      "flex items-center",
      compact ? "gap-1" : "gap-3 p-1.5 bg-muted/20 rounded-md border border-dashed", 
      className
    )}>
      {!compact && (
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-1">
          Currency:
        </span>
      )}
      <div className={cn(
        "flex gap-1 rounded-sm border shadow-sm",
        compact ? "p-0.5" : "bg-muted/50 p-0.5"
      )}>
        {CURRENCIES.map(({ id, label, Icon }) => {
          const isActive = activeCurrency === id;
          return (
            <button
              key={id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onCurrencyChange(id);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-[2px] text-[10px] font-bold transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title={label}
            >
              <Icon className="w-3.5 h-2.5 rounded-[0.5px]" />
              {!compact && <span className="uppercase">{id}</span>}
              {compact && <span className="uppercase text-[9px]">{id}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCurrencyTabs;

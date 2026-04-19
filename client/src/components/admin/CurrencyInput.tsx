"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import CurrencyField from "./CurrencyField";
import { AdminCurrency } from "./AdminCurrencyTabs";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  value: any;
  onChange: (value: any) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  "data-field"?: string;
  error?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value = { USD: 0 },
  onChange,
  label,
  placeholder,
  className = "",
  "data-field": dataField,
  error,
}) => {
  const currencySymbols: Record<AdminCurrency, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  return (
    <CurrencyField
      label={label}
      value={value}
      error={error}
      className={className}
      onChange={(currency, val) => onChange({ ...value, [currency]: val })}
    >
      {(activeCurrency, currentValue, handleVal) => (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
            {currencySymbols[activeCurrency]}
          </span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={currentValue ?? ""}
            onChange={(e) => handleVal(e.target.value === "" ? undefined : parseFloat(e.target.value))}
            placeholder={placeholder || `0.00`}
            className={cn(
              "h-10 pl-8 transition-all focus:ring-1 focus:ring-[#b79c5c]",
              error && "border-red-500 ring-red-500 focus:ring-red-500"
            )}
            data-field={dataField}
          />
        </div>
      )}
    </CurrencyField>
  );
};

export default CurrencyInput;

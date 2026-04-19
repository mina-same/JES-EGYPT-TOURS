"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import AdminCurrencyTabs, { AdminCurrency } from "./AdminCurrencyTabs";
import { cn } from "@/lib/utils";

interface CurrencyFieldProps {
  label?: string;
  value: any;
  onChange: (currency: AdminCurrency, value: any) => void;
  className?: string;
  children: (
    activeCurrency: AdminCurrency,
    currentValue: any,
    handleCurrencyChange: (val: any) => void
  ) => React.ReactNode;
  activeCurrency?: AdminCurrency;
  error?: boolean;
}

const CurrencyField: React.FC<CurrencyFieldProps> = ({
  label,
  value,
  onChange,
  className = "",
  children,
  activeCurrency: globalCurrency,
  error,
}) => {
  const [localCurrency, setLocalCurrency] = useState<AdminCurrency>(globalCurrency || "USD");

  React.useEffect(() => {
    if (globalCurrency) {
      setLocalCurrency(globalCurrency);
    }
  }, [globalCurrency]);

  const currentCurrency = localCurrency;

  const handleCurrencySwitch = (lang: AdminCurrency) => {
    setLocalCurrency(lang);
  };

  const currentVal = value ? value[currentCurrency] : "";

  const handleValueChange = (newVal: any) => {
    onChange(currentCurrency, newVal);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {label && (
          <Label className={cn("text-sm font-semibold", error && "text-red-500")}>
            {label}
            {error && <span className="ml-1">⚠</span>}
          </Label>
        )}
        <AdminCurrencyTabs
          activeCurrency={currentCurrency}
          onCurrencyChange={handleCurrencySwitch}
          compact={true}
        />
      </div>

      <div className="relative">
        {children(currentCurrency, currentVal, handleValueChange)}
      </div>
    </div>
  );
};

export default CurrencyField;

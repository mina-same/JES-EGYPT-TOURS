"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, Loader2, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPageSkeleton } from "@/components/admin/AdminPageSkeleton";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/config/permissions";
import { currencyAPI } from "@/lib/api/currency";
import { parseRateInput, rateInputError, ratePreview } from "@/lib/currency/rateForm";

/**
 * Admin → Tour → Exchange Rates.
 *
 * Tours are priced in USD. A price without a manual EUR or GBP amount is
 * shown to visitors as USD × the rate below, rounded to the nearest 5, on the
 * tour page, the tour cards, the booking quote and the tour's structured
 * data. Manual EUR/GBP prices are never converted.
 *
 * Saving calls PUT /api/currency/rates, which only users with the tour:update
 * permission (and superadmins) may use, and which refreshes the site's cached
 * pages right away.
 */

const formatUpdatedAt = (iso: string | null): string => {
  if (!iso) return "never";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "unknown"
    : date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
};

const responseError = (response: { message?: string; error?: string } | undefined, fallback: string) =>
  response?.message || response?.error || fallback;

export default function ExchangeRatesPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(PERMISSIONS.TOUR_UPDATE);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ EUR: number; GBP: number } | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [eur, setEur] = useState("");
  const [gbp, setGbp] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await currencyAPI.getRates();
    if (response.success && response.data) {
      const { EUR, GBP } = response.data.rates;
      setSaved({ EUR, GBP });
      setEur(String(EUR));
      setGbp(String(GBP));
      setUpdatedAt(response.data.updatedAt || null);
      setLoadError(null);
    } else {
      setLoadError(responseError(response as any, "The exchange rates could not be loaded."));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const eurError = rateInputError(eur);
  const gbpError = rateInputError(gbp);
  const preview = useMemo(() => ratePreview(eur, gbp), [eur, gbp]);
  const changed =
    !!saved && (parseRateInput(eur) !== saved.EUR || parseRateInput(gbp) !== saved.GBP);
  const canSave = canEdit && changed && !eurError && !gbpError && !saving;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const response = await currencyAPI.updateRates({
      EUR: parseRateInput(eur)!,
      GBP: parseRateInput(gbp)!,
    });
    setSaving(false);
    if (response.success && response.data) {
      const { EUR, GBP } = response.data.rates;
      setSaved({ EUR, GBP });
      setEur(String(EUR));
      setGbp(String(GBP));
      setUpdatedAt(response.data.updatedAt || null);
      toast({
        title: "Exchange rates saved",
        description: `1 USD = ${EUR} EUR = ${GBP} GBP. The website uses them from now on.`,
        variant: "success",
      });
    } else {
      toast({
        title: "Not saved",
        description: responseError(response as any, "The exchange rates could not be saved."),
        variant: "destructive",
      });
    }
  };

  if (loading) return <AdminPageSkeleton />;

  return (
    <div className="admin-scope max-full space-y-6 pb-24 p-6">
      <div>
        <h1 className="admin-page-title">Exchange Rates</h1>
        <p className="admin-page-subtitle">
          Tour prices are entered in USD. Where a price has no manual EUR or GBP amount, visitors see the USD
          price converted with these rates and rounded to the nearest 5. Manual EUR/GBP prices are always shown
          as entered.
        </p>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert">
          {loadError}
        </div>
      )}

      {!loadError && saved && (
        <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" aria-hidden="true" />
                Rates per 1 USD
              </CardTitle>
              <CardDescription>Last updated: {formatUpdatedAt(updatedAt)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canEdit && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  Only users who may edit tours can change the rates.
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="rate-eur">EUR for 1 USD</Label>
                <Input
                  id="rate-eur"
                  inputMode="decimal"
                  value={eur}
                  onChange={(e) => setEur(e.target.value)}
                  disabled={!canEdit || saving}
                  aria-invalid={!!eurError}
                  aria-describedby={eurError ? "rate-eur-error" : undefined}
                />
                {eurError && <p id="rate-eur-error" className="text-xs text-red-600">{eurError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate-gbp">GBP for 1 USD</Label>
                <Input
                  id="rate-gbp"
                  inputMode="decimal"
                  value={gbp}
                  onChange={(e) => setGbp(e.target.value)}
                  disabled={!canEdit || saving}
                  aria-invalid={!!gbpError}
                  aria-describedby={gbpError ? "rate-gbp-error" : undefined}
                />
                {gbpError && <p id="rate-gbp-error" className="text-xs text-red-600">{gbpError}</p>}
              </div>
              {canEdit && (
                <Button type="submit" disabled={!canSave}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save rates
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What visitors will see</CardTitle>
              <CardDescription>Converted with the rates on the left, rounded to the nearest 5.</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 font-medium">USD price</th>
                    <th className="py-2 font-medium">EUR</th>
                    <th className="py-2 font-medium">GBP</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.usd} className="border-t">
                      <td className="py-2">${row.usd}</td>
                      <td className="py-2">{row.eur === null ? "—" : `€${row.eur}`}</td>
                      <td className="py-2">{row.gbp === null ? "—" : `£${row.gbp}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}

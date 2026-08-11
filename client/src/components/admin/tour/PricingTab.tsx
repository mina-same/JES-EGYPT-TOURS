import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import PricingPlansManager from '@/components/admin/PricingPlansManager';
import TourKindSelector from '@/components/admin/tour/TourKindSelector';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedInput from '@/components/admin/LocalizedInput';
import { deriveStartingPrice } from '@/lib/tours/startingPrice';
import { cn } from '@/lib/utils';
import type { FormErrorItem } from '@/lib/parseApiError';

interface PricingTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  activeLanguage: AdminLanguage;
  formErrors?: FormErrorItem[];
}

export default function PricingTab({ formData, handleChange, activeLanguage, formErrors = [] }: PricingTabProps) {
  const hasPricingError = formErrors.some(e => e.path === 'pricingPlans' || e.path?.startsWith('pricingPlans'));
  // Live preview of what the server will store on save.
  const derivedStartingPrice = deriveStartingPrice(formData.pricingPlans);
  return (
    <div className="space-y-6">
      {/* Base Price & Cancellation */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Overview</CardTitle>
          <CardDescription>Base price and cancellation policy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Read-only, and derived from the plans below rather than typed.
              Two independent numbers drifted apart in practice: a tour card
              advertised $1200 while its own pricing table said $100. The server
              recomputes this on every save, so anything typed here would be
              overwritten anyway — better to show what will actually be stored.
              Each currency takes the lowest amount entered in that SAME
              currency; converting a USD minimum would quote a figure nobody
              set. */}
          <div className="space-y-2">
            <Label>Starting From Price</Label>
            <div className="flex flex-wrap gap-2">
              {derivedStartingPrice ? (
                (['USD', 'EUR', 'GBP'] as const).map((currency) =>
                  derivedStartingPrice[currency] !== undefined ? (
                    <span
                      key={currency}
                      className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-semibold"
                    >
                      {currency} {derivedStartingPrice[currency]}
                    </span>
                  ) : null
                )
              ) : (
                <span className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  Not priced yet
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Calculated automatically from the cheapest amount in the pricing
              plans below, per currency. Leave a plan unpriced and it is simply
              skipped.
            </p>
          </div>

          <div className="space-y-2">
            <LocalizedInput
              label="Cancellation Policy"
              value={formData.cancellationPolicy || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('cancellationPolicy', val)}
              placeholder="e.g., Free cancellation up to 24h before"
              data-field="cancellationPolicy"
              error={formErrors.some(e => e.path === 'cancellationPolicy' || e.path === 'cancellationPolicy.en')}
              activeLanguage={activeLanguage}
            />
            {(formErrors.some(e => e.path === 'cancellationPolicy' || e.path === 'cancellationPolicy.en')) && (
              <p className="text-xs text-red-600">
                {formErrors.find(e => e.path?.startsWith('cancellationPolicy'))?.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tour kind — chosen BEFORE the plans, because it decides which plans
          are even offered. */}
      <TourKindSelector
        value={formData.tourKind}
        pricingPlans={formData.pricingPlans || []}
        onChange={(kind, keptPlans) => {
          handleChange('tourKind', kind);
          handleChange('pricingPlans', keptPlans);
        }}
      />

      {/* Pricing Plans Manager */}
      <Card className={cn(hasPricingError && 'border-red-400 ring-1 ring-red-300')}>
        <CardHeader>
          <CardTitle className={cn(hasPricingError && 'text-red-600')}>Pricing Plans</CardTitle>
          <CardDescription>
            {formData.tourKind === 'DAY_TOUR'
              ? 'One price for the whole tour.'
              : formData.tourKind === 'PACKAGE'
                ? 'Add the tiers you offer — one, two or all three.'
                : 'Choose a tour kind above to pick from the right plans.'}
          </CardDescription>
          {hasPricingError && <p className="text-xs text-red-600 mt-1">{formErrors.find(e => e.path === 'pricingPlans')?.message}</p>}
        </CardHeader>
        <CardContent>
          <PricingPlansManager
            pricingPlans={formData.pricingPlans || []}
            onChange={(plans) => handleChange('pricingPlans', plans)}
            activeLanguage={activeLanguage}
            formErrors={formErrors}
            tourKind={formData.tourKind}
          />
        </CardContent>
      </Card>
    </div>
  );
}

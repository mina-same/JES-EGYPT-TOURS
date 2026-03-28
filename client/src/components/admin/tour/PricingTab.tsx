import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import PricingPlansManager from '@/components/admin/PricingPlansManager';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedInput from '@/components/admin/LocalizedInput';
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
  return (
    <div className="space-y-6">
      {/* Base Price & Cancellation */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Overview</CardTitle>
          <CardDescription>Base price and cancellation policy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2" data-field="priceStartingFrom">
            <Label 
              htmlFor="priceStartingFrom"
              className={cn(formErrors.some(e => e.path === 'priceStartingFrom') && 'text-red-600')}
            >
              Starting From Price ($) * {formErrors.some(e => e.path === 'priceStartingFrom') && '⚠'}
            </Label>
            <Input
              id="priceStartingFrom"
              type="number"
              min="0"
              value={formData.priceStartingFrom || ''}
              onChange={(e) => handleChange('priceStartingFrom', e.target.value === '' ? undefined : parseFloat(e.target.value))}
              placeholder="0.00"
              className={cn(formErrors.some(e => e.path === 'priceStartingFrom') && 'border-red-500 focus-visible:ring-red-500')}
            />
            {formErrors.some(e => e.path === 'priceStartingFrom') && (
              <p className="text-xs text-red-600">{formErrors.find(e => e.path === 'priceStartingFrom')?.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <LocalizedInput
              label="Cancellation Policy *"
              value={formData.cancellationPolicy || { en: '', de: '', it: '', es: '' }}
              onChange={(val) => handleChange('cancellationPolicy', val)}
              placeholder="e.g., Free cancellation up to 24h before"
              data-field="cancellationPolicy"
              error={formErrors.some(e => e.path === 'cancellationPolicy' || e.path === 'cancellationPolicy.en')}
            />
            {(formErrors.some(e => e.path === 'cancellationPolicy' || e.path === 'cancellationPolicy.en')) && (
              <p className="text-xs text-red-600">
                {formErrors.find(e => e.path?.startsWith('cancellationPolicy'))?.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans Manager */}
      <Card className={cn(hasPricingError && 'border-red-400 ring-1 ring-red-300')}>
        <CardHeader>
          <CardTitle className={cn(hasPricingError && 'text-red-600')}>Pricing Plans *</CardTitle>
          <CardDescription>Manage seasonal pricing and packages</CardDescription>
          {hasPricingError && <p className="text-xs text-red-600 mt-1">{formErrors.find(e => e.path === 'pricingPlans')?.message}</p>}
        </CardHeader>
        <CardContent>
          <PricingPlansManager
            pricingPlans={formData.pricingPlans || []}
            onChange={(plans) => handleChange('pricingPlans', plans)}
            activeLanguage={activeLanguage}
            formErrors={formErrors}
          />
        </CardContent>
      </Card>
    </div>
  );
}

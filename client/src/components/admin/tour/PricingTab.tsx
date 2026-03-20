import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import PricingPlansManager from '@/components/admin/PricingPlansManager';
import { type AdminLanguage } from '@/components/admin/AdminLanguageTabs';
import LocalizedField from '@/components/admin/LocalizedField';

interface PricingTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
  activeLanguage: AdminLanguage;
}

export default function PricingTab({ formData, handleChange, activeLanguage }: PricingTabProps) {
  return (
    <div className="space-y-6">
      {/* Base Price & Cancellation */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Overview</CardTitle>
          <CardDescription>Base price and cancellation policy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="priceStartingFrom">Starting From Price ($)</Label>
            <Input
              id="priceStartingFrom"
              type="number"
              min="0"
              value={formData.priceStartingFrom || ''}
              onChange={(e) => handleChange('priceStartingFrom', parseFloat(e.target.value))}
              placeholder="0.00"
            />
          </div>

          <LocalizedField
            label="Cancellation Policy"
            value={formData.cancellationPolicy}
            globalLanguage={activeLanguage}
            onChange={(lang, val) => handleChange(`cancellationPolicy.${lang}`, val)}
          >
            {(lang, currentValue, handleLang) => (
              <Input
                id="cancellationPolicy"
                value={currentValue}
                onChange={(e) => handleLang(e.target.value)}
                placeholder={`e.g., Free cancellation up to 24h before (${lang})`}
              />
            )}
          </LocalizedField>
        </CardContent>
      </Card>

      {/* Pricing Plans Manager */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Plans</CardTitle>
          <CardDescription>Manage seasonal pricing and packages</CardDescription>
        </CardHeader>
        <CardContent>
          <PricingPlansManager
            pricingPlans={formData.pricingPlans || []}
            onChange={(plans) => handleChange('pricingPlans', plans)}
            activeLanguage={activeLanguage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

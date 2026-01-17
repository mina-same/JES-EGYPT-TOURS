import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import PricingPlansManager from '@/components/admin/PricingPlansManager';

interface PricingTabProps {
  formData: any;
  handleChange: (field: string, value: any) => void;
}

export default function PricingTab({ formData, handleChange }: PricingTabProps) {
  return (
    <div className="space-y-6">
      {/* Base Price & Cancellation */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Overview</CardTitle>
          <CardDescription>General pricing settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Input
                id="cancellationPolicy"
                value={formData.cancellationPolicy}
                onChange={(e) => handleChange('cancellationPolicy', e.target.value)}
                placeholder="e.g., Free cancellation up to 24h before"
              />
            </div>
          </div>
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
          />
        </CardContent>
      </Card>
    </div>
  );
}

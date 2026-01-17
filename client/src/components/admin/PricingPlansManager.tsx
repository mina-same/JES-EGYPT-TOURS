'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, X, Calendar, DollarSign, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IPricingPlan, IPricingSeason, IPricingNote } from '@/types/tour';
import { cn } from '@/lib/utils';

interface PricingPlansManagerProps {
  pricingPlans: IPricingPlan[];
  onChange: (plans: IPricingPlan[]) => void;
}

export default function PricingPlansManager({ pricingPlans, onChange }: PricingPlansManagerProps) {
  const PLAN_OPTIONS = [
    'AFFORDABLE',
    'GOLD (5 STAR STANDARD)', 
    'DIAMOND (5 STAR LUXURY)'
  ];

  const SEASON_OPTIONS = [
    "From Oct 2025 to Dec 2025",
    "From Jan 2026 to Mar 2026",
    "From 15 Apr 2026 to 30 Sep 2026",
    "Peak (20 Dec 2025 - 5 Jan 2026) / (25 Mar - 15 Apr 2026)"
  ];

  // Add new pricing plan with all seasons initialized
  const addPricingPlan = () => {
    const newPlan: IPricingPlan = {
      planName: '',
      seasons: SEASON_OPTIONS.map(seasonName => ({
        seasonName,
        startDate: '',
        endDate: '',
        prices: {
          solo: 0,
          pax_2_4: 0,
          pax_5_8: 0,
          pax_9_16: 0,
        },
        notes: [],
      })),
    };
    onChange([...pricingPlans, newPlan]);
  };

  // Remove pricing plan
  const removePricingPlan = (planIndex: number) => {
    onChange(pricingPlans.filter((_, i) => i !== planIndex));
  };

  // Update pricing plan
  const updatePricingPlan = (planIndex: number, field: keyof IPricingPlan, value: any) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex ? { ...plan, [field]: value } : plan
    );
    onChange(updated);
  };

  // Update season prices
  const updateSeasonPrice = (planIndex: number, seasonIndex: number, priceType: keyof IPricingSeason['prices'], value: number) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? {
            ...plan,
            seasons: plan.seasons.map((season, j) => 
              j === seasonIndex 
                ? { ...season, prices: { ...season.prices, [priceType]: value } }
                : season
            )
          }
        : plan
    );
    onChange(updated);
  };

  // Add note to season
  const addSeasonNote = (planIndex: number, seasonIndex: number) => {
    const newNote: IPricingNote = { title: '', text: '' };
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? {
            ...plan,
            seasons: plan.seasons.map((season, j) => 
              j === seasonIndex 
                ? { ...season, notes: [...season.notes, newNote] }
                : season
            )
          }
        : plan
    );
    onChange(updated);
  };

  // Remove note from season
  const removeSeasonNote = (planIndex: number, seasonIndex: number, noteIndex: number) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? {
            ...plan,
            seasons: plan.seasons.map((season, j) => 
              j === seasonIndex 
                ? { ...season, notes: season.notes.filter((_, k) => k !== noteIndex) }
                : season
            )
          }
        : plan
    );
    onChange(updated);
  };

  // Update season note
  const updateSeasonNote = <K extends keyof IPricingNote>(planIndex: number, seasonIndex: number, noteIndex: number, field: K, value: IPricingNote[K]) => {
    const updated = pricingPlans.map((plan, i) => 
      i === planIndex 
        ? {
            ...plan,
            seasons: plan.seasons.map((season, j) => 
              j === seasonIndex 
                ? {
                    ...season,
                    notes: season.notes.map((note, k) => 
                      k === noteIndex ? { ...note, [field]: value } : note
                    )
                  }
                : season
            )
          }
        : plan
    );
    onChange(updated);
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Pricing Plans</h3>
            <p className="text-sm text-muted-foreground">
              Configure pricing for different seasons and group sizes
            </p>
          </div>
          <Button type="button" onClick={addPricingPlan}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 space-y-8">
        {pricingPlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No pricing plans yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              Create your first pricing plan to start adding seasonal rates.
            </p>
            <Button type="button" onClick={addPricingPlan}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Plan
            </Button>
          </div>
        ) : (
          pricingPlans.map((plan, planIndex) => (
            <div key={planIndex} className="space-y-4">
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
                <div className="flex-1 max-w-sm">
                  <Label htmlFor={`planName-${planIndex}`} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Plan Type
                  </Label>
                  <Select
                    value={plan.planName}
                    onValueChange={(value) => updatePricingPlan(planIndex, 'planName', value)}
                  >
                    <SelectTrigger className="bg-background font-medium">
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePricingPlan(planIndex)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Plan
                </Button>
              </div>

              {/* Seasons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {plan.seasons.map((season, seasonIndex) => (
                  <div 
                    key={seasonIndex} 
                    className="flex flex-col h-full border rounded-lg bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20"
                  >
                    {/* Season Header */}
                    <div className="p-3 bg-muted/30 border-b">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">Season</span>
                      </div>
                      <p className="text-sm font-medium leading-tight min-h-[2.5rem] flex items-center">
                        {season.seasonName}
                      </p>
                    </div>

                    <div className="p-4 space-y-6 flex-1 flex flex-col">
                      {/* Prices */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3" />
                          Prices (USD)
                        </Label>
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                            <Label htmlFor={`solo-${planIndex}-${seasonIndex}`} className="text-xs text-muted-foreground">Solo</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                              <Input
                                id={`solo-${planIndex}-${seasonIndex}`}
                                type="number"
                                min="0"
                                className="h-8 pl-5 text-sm"
                                value={season.prices.solo || ''}
                                onChange={(e) => updateSeasonPrice(planIndex, seasonIndex, 'solo', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                            <Label htmlFor={`pax24-${planIndex}-${seasonIndex}`} className="text-xs text-muted-foreground">2-4 Pax</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                              <Input
                                id={`pax24-${planIndex}-${seasonIndex}`}
                                type="number"
                                min="0"
                                className="h-8 pl-5 text-sm"
                                value={season.prices.pax_2_4 || ''}
                                onChange={(e) => updateSeasonPrice(planIndex, seasonIndex, 'pax_2_4', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                            <Label htmlFor={`pax58-${planIndex}-${seasonIndex}`} className="text-xs text-muted-foreground">5-8 Pax</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                              <Input
                                id={`pax58-${planIndex}-${seasonIndex}`}
                                type="number"
                                min="0"
                                className="h-8 pl-5 text-sm"
                                value={season.prices.pax_5_8 || ''}
                                onChange={(e) => updateSeasonPrice(planIndex, seasonIndex, 'pax_5_8', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                            <Label htmlFor={`pax916-${planIndex}-${seasonIndex}`} className="text-xs text-muted-foreground">9-16 Pax</Label>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                              <Input
                                id={`pax916-${planIndex}-${seasonIndex}`}
                                type="number"
                                min="0"
                                className="h-8 pl-5 text-sm"
                                value={season.prices.pax_9_16 || ''}
                                onChange={(e) => updateSeasonPrice(planIndex, seasonIndex, 'pax_9_16', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-3 pt-3 border-t mt-auto">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase">Notes</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs hover:bg-primary/10 hover:text-primary"
                            onClick={() => addSeasonNote(planIndex, seasonIndex)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {season.notes.map((note, noteIndex) => (
                            <div key={noteIndex} className="group relative bg-muted/30 p-2 rounded-md border text-xs">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute -right-1 -top-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm rounded-full"
                                onClick={() => removeSeasonNote(planIndex, seasonIndex, noteIndex)}
                              >
                                <X className="w-3 h-3 text-muted-foreground" />
                              </Button>
                              <div className="space-y-1.5">
                                <Input
                                  className="h-6 text-xs border-0 bg-transparent p-0 placeholder:text-muted-foreground/50 focus-visible:ring-0 font-medium"
                                  value={note.title}
                                  onChange={(e) => updateSeasonNote(planIndex, seasonIndex, noteIndex, 'title', e.target.value)}
                                  placeholder="Note Title"
                                />
                                <Input
                                  className="h-6 text-xs border-0 bg-transparent p-0 placeholder:text-muted-foreground/50 focus-visible:ring-0"
                                  value={note.text}
                                  onChange={(e) => updateSeasonNote(planIndex, seasonIndex, noteIndex, 'text', e.target.value)}
                                  placeholder="Note Description"
                                />
                              </div>
                            </div>
                          ))}
                          {season.notes.length === 0 && (
                            <div className="text-xs text-muted-foreground italic text-center py-2">
                              No notes added
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

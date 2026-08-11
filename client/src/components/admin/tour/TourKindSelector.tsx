import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CalendarDays, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  plansAllowedForKind,
  plansIncompatibleWith,
  type TourKind,
} from '@/lib/tours/tourKind';
import { ensureDayTourPlan } from '@/lib/tours/pricingPlans';
import type { IPricingPlan } from '@/types/tour';

interface TourKindSelectorProps {
  value?: TourKind;
  pricingPlans: Array<{ planName?: string }>;
  /** Receives the new kind AND the plans that survive it, so the caller writes
   *  both in one go and can never leave an illegal pair in the form. */
  onChange: (kind: TourKind, keptPlans: Array<{ planName?: string }>) => void;
}

const OPTIONS: Array<{ kind: TourKind; label: string; hint: string; Icon: typeof Package }> = [
  {
    kind: 'DAY_TOUR',
    label: 'Day Tour',
    hint: 'A single price. Visitors are not asked to pick a package.',
    Icon: CalendarDays,
  },
  {
    kind: 'PACKAGE',
    label: 'Package',
    hint: 'Priced in tiers. Visitors choose one when booking.',
    Icon: Package,
  },
];

/**
 * Day tour or package — the choice that governs the pricing plans below it.
 *
 * Switching kinds can invalidate plans that are already filled in, so the
 * change is never silent: the plans that would be lost are named, and nothing
 * is discarded until the admin confirms. Cancelling leaves the form untouched.
 */
export default function TourKindSelector({ value, pricingPlans, onChange }: TourKindSelectorProps) {
  const [pendingKind, setPendingKind] = useState<TourKind | null>(null);

  /** A day tour has one legal plan name, so the plan is created (or renamed)
   *  here rather than making the admin add a plan and then pick its only
   *  option. Packages keep whatever survived the switch — their tiers are a
   *  real choice. */
  const settlePlans = (kind: TourKind, plans: Array<{ planName?: string }>) =>
    kind === 'DAY_TOUR' ? ensureDayTourPlan(plans as IPricingPlan[]) : plans;

  const select = (kind: TourKind) => {
    if (kind === value) return;

    const losing = plansIncompatibleWith(kind, pricingPlans);
    if (losing.length > 0) {
      setPendingKind(kind);
      return;
    }
    onChange(kind, settlePlans(kind, pricingPlans));
  };

  const confirmSwitch = () => {
    if (!pendingKind) return;
    const allowed = plansAllowedForKind(pendingKind);
    let kept = (pricingPlans || []).filter((p) => p?.planName && allowed.includes(p.planName));
    if (pendingKind === 'DAY_TOUR') kept = kept.slice(0, 1);
    onChange(pendingKind, settlePlans(pendingKind, kept));
    setPendingKind(null);
  };

  const losingForPending = pendingKind ? plansIncompatibleWith(pendingKind, pricingPlans) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tour Kind</CardTitle>
        <CardDescription>Decides which pricing plans this tour can use.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map(({ kind, label, hint, Icon }) => {
            const active = value === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => select(kind)}
                aria-pressed={active}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 text-left transition',
                  active
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-input hover:border-primary/50 hover:bg-muted/40'
                )}
              >
                <Icon size={18} className={cn('mt-0.5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </span>
              </button>
            );
          })}
        </div>

        {!value && (
          <p className="text-xs text-amber-600">
            Not set yet — pick one so the pricing plans below offer the right options.
          </p>
        )}

        {pendingKind && (
          <div
            role="alertdialog"
            aria-label="Confirm changing the tour kind"
            className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/30"
          >
            <div className="flex gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Switching to {pendingKind === 'DAY_TOUR' ? 'Day Tour' : 'Package'} removes pricing you have already entered.
                  </p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                    These plans and all their seasons and prices will be deleted:
                  </p>
                  <ul className="mt-2 list-inside list-disc text-sm font-medium text-amber-900 dark:text-amber-200">
                    {losingForPending.map((name, i) => (
                      <li key={`${name}-${i}`}>{name}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                    Nothing is written until you save the tour, so you can still leave without saving.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" size="sm" onClick={confirmSwitch}>
                    Delete them and switch
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPendingKind(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

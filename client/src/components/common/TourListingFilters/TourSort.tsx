'use client';

import { useId } from 'react';
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { PUBLIC_SORTS, type PublicSort } from '@/lib/tours/publicListingUrl';

const labels: Record<string, string> = {
  recommended: 'recommended', 'price-asc': 'priceAsc', 'price-desc': 'priceDesc',
  'duration-asc': 'durationAsc', 'duration-desc': 'durationDesc',
};

export default function TourSort({ value, onChange, t }: {
  value: PublicSort; onChange: (value: PublicSort) => void; t: (key: string) => string;
}) {
  const id = useId();
  return <div className="visitor-sort">
    <label id={id + '-label'} htmlFor={id}>{t('listing.sortBy')}</label>
    <Select.Root value={value} onValueChange={value => onChange(value as PublicSort)}>
      <Select.Trigger id={id} className="visitor-sort-trigger" aria-labelledby={id + '-label'}>
        <Select.Value>{t('listing.sortOptions.' + (labels[value] || 'recommended'))}</Select.Value>
        <Select.Icon asChild><ChevronDown size={16} aria-hidden="true" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="visitor-sort-menu" position="popper" align="end" sideOffset={6} collisionPadding={12}>
          <Select.ScrollUpButton className="visitor-sort-scroll"><ChevronUp size={16} /></Select.ScrollUpButton>
          <Select.Viewport className="visitor-sort-options">
            {PUBLIC_SORTS.map(option => <Select.Item key={option} value={option} className="visitor-sort-option" data-sort-value={option}>
              <Select.ItemText>{t('listing.sortOptions.' + labels[option])}</Select.ItemText>
              <Select.ItemIndicator className="visitor-sort-check"><Check size={17} aria-hidden="true" /></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Viewport>
          <Select.ScrollDownButton className="visitor-sort-scroll"><ChevronDown size={16} /></Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>;
}

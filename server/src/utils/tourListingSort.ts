import type { PipelineStage } from 'mongoose';
import { effectiveStartingPriceExpression, type TourCurrency } from './tourQuery';

export function listingSortStages(sort: string, currency: TourCurrency, rate: number): PipelineStage[] {
  const recommended = sort === 'recommended';
  const value = sort.includes('priceStartingFrom') ? effectiveStartingPriceExpression(currency, rate)
    : recommended ? '$recommendedOrder' : '$durationHours';
  const valid = { $and: [{ $isNumber: '$__listingValue' }, recommended
    ? { $gte: ['$__listingValue', 0] } : { $gt: ['$__listingValue', 0] }] };
  return [
    { $addFields: { __listingValue: value } },
    { $addFields: { __listingRank: { $cond: [valid, 0, 1] } } },
    // Missing/invalid values tie with each other instead of acquiring a price.
    { $addFields: { __listingValue: { $cond: [{ $eq: ['$__listingRank', 0] }, '$__listingValue', null] } } },
    { $sort: { __listingRank: 1, __listingValue: sort.startsWith('-') ? -1 : 1, createdAt: -1, _id: 1 } },
  ];
}

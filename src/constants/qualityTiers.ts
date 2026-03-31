export interface QualityTier {
  id: string;
  label: string;
  price: number;
  description: string;
  purpose: string;
}

export const QUALITY_TIERS: QualityTier[] = [
  {
    id: 'web',
    label: 'Web quality',
    price: 499,
    description: 'Best for social media and screen use.',
    purpose: 'screen/social',
  },
  {
    id: 'high',
    label: 'High quality',
    price: 999,
    description: 'Best for printing and large displays.',
    purpose: 'print/large displays',
  },
  {
    id: 'commercial',
    label: 'Commercial use',
    price: 1500,
    description: 'Best for printing and large displays.', // Name and price differ, purpose text same as High quality
    purpose: 'print/large displays',
  },
];

export const getPriceByTierId = (id: string): number => {
  const tier = QUALITY_TIERS.find(t => t.id === id);
  return tier ? tier.price : 999;
};

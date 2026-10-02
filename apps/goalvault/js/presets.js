// Category colour and icon choices (Lucide icon names).
export const COLORS = [
  { key: 'emerald', hex: '#10b981' },
  { key: 'sky', hex: '#0ea5e9' },
  { key: 'violet', hex: '#8b5cf6' },
  { key: 'amber', hex: '#f59e0b' },
  { key: 'rose', hex: '#f43f5e' },
  { key: 'teal', hex: '#14b8a6' },
  { key: 'indigo', hex: '#6366f1' },
  { key: 'slate', hex: '#64748b' },
];

export const ICONS = [
  'piggy-bank', 'wallet', 'house', 'car', 'plane', 'graduation-cap', 'heart-pulse', 'briefcase',
  'gift', 'shield', 'trending-up', 'baby', 'smartphone', 'gem', 'landmark', 'target',
];

export const colorHex = (key) => (COLORS.find((c) => c.key === key) ?? COLORS[0]).hex;

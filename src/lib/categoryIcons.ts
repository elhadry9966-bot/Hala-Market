import { Baby, Dumbbell, Gamepad2, House, Package, Shirt, Smartphone, Sparkles, Watch } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Smartphone,
  Shirt,
  House,
  Sparkles,
  Dumbbell,
  Gamepad2,
  Baby,
  Watch,
};

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Package;
}

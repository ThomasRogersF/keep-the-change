import {
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Film,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  MoreHorizontal,
  Music,
  PiggyBank,
  Plane,
  RefreshCw,
  Shirt,
  ShoppingBag,
  Tag,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  UtensilsCrossed,
  Car,
  Gamepad2,
  ShoppingBag,
  Heart,
  Zap,
  RefreshCw,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Plane,
  Gift,
  Music,
  Film,
  Coffee,
  Shirt,
  Dumbbell,
  PiggyBank,
  CreditCard,
};

interface DynamicIconProps extends React.SVGAttributes<SVGSVGElement> {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon {...props} />;
}

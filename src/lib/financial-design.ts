import {
  Wallet,
  Target,
  ShieldCheck,
  PiggyBank,
  TrendingUp,
  Landmark,
  Bitcoin,
  Gem,
  ArrowRightLeft,
  CircleDollarSign,
  type LucideIcon,
  CreditCard,
  Banknote
} from 'lucide-react';

export type FinancialType =
  | 'budgeting'
  | 'goals'
  | 'emergency'
  | 'savings'
  | 'yield'
  | 'investments'
  | 'digital'
  | 'wealth'
  | 'transfers'
  | 'income'
  | 'expense';

export function getFinancialTone(type: FinancialType): string {
  switch (type) {
    case 'budgeting': return 'bg-finance-budgeting text-finance-budgeting-foreground';
    case 'goals': return 'bg-finance-goals text-finance-goals-foreground';
    case 'emergency': return 'bg-finance-emergency text-finance-emergency-foreground';
    case 'savings': return 'bg-finance-savings text-finance-savings-foreground';
    case 'yield': return 'bg-finance-yield text-finance-yield-foreground';
    case 'investments': return 'bg-finance-investments text-finance-investments-foreground';
    case 'digital': return 'bg-finance-digital text-finance-digital-foreground';
    case 'wealth': return 'bg-finance-wealth text-finance-wealth-foreground';
    case 'transfers': return 'bg-finance-transfers text-finance-transfers-foreground';
    case 'income': return 'bg-success text-success-foreground';
    case 'expense': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-primary text-primary-foreground';
  }
}

export function getFinancialToneText(type: FinancialType): string {
  switch (type) {
    case 'budgeting': return 'text-finance-budgeting';
    case 'goals': return 'text-finance-goals';
    case 'emergency': return 'text-finance-emergency';
    case 'savings': return 'text-finance-savings';
    case 'yield': return 'text-finance-yield';
    case 'investments': return 'text-finance-investments';
    case 'digital': return 'text-finance-digital';
    case 'wealth': return 'text-finance-wealth';
    case 'transfers': return 'text-finance-transfers';
    case 'income': return 'text-success';
    case 'expense': return 'text-finance-budgeting';
    default: return 'text-foreground';
  }
}

export function getFinancialToneBorder(type: FinancialType): string {
    switch (type) {
      case 'budgeting': return 'border-finance-budgeting';
      case 'goals': return 'border-finance-goals';
      case 'emergency': return 'border-finance-emergency';
      case 'savings': return 'border-finance-savings';
      case 'yield': return 'border-finance-yield';
      case 'investments': return 'border-finance-investments';
      case 'digital': return 'border-finance-digital';
      case 'wealth': return 'border-finance-wealth';
      case 'transfers': return 'border-finance-transfers';
      case 'income': return 'border-success';
      case 'expense': return 'border-finance-budgeting';
      default: return 'border-border';
    }
  }

export function getFinancialIcon(type: FinancialType): LucideIcon {
  switch (type) {
    case 'budgeting': return CreditCard;
    case 'goals': return Target;
    case 'emergency': return ShieldCheck;
    case 'savings': return PiggyBank;
    case 'yield': return TrendingUp;
    case 'investments': return Landmark;
    case 'digital': return Bitcoin;
    case 'wealth': return Gem;
    case 'transfers': return ArrowRightLeft;
    case 'income': return Banknote;
    case 'expense': return Wallet;
    default: return CircleDollarSign;
  }
}

export function getFinancialLabel(type: FinancialType): string {
  switch (type) {
    case 'budgeting': return 'Budgeting';
    case 'goals': return 'Goals';
    case 'emergency': return 'Emergency Fund';
    case 'savings': return 'Savings';
    case 'yield': return 'Yield';
    case 'investments': return 'Investments';
    case 'digital': return 'Digital Assets';
    case 'wealth': return 'Total Wealth';
    case 'transfers': return 'Transfers';
    case 'income': return 'Income';
    case 'expense': return 'Expense';
    default: return 'Finance';
  }
}

"use client";

import { Wallet } from "lucide-react";
import { useSettingsStore } from "@/lib/stores/settings.store";
import { CURRENCIES } from "@/lib/utils/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function WealthSettingsCard() {
  const {
    currency,
    defaultWealthCurrency,
    setDefaultWealthCurrency,
    emergencyFundsCountAsLiquid,
    setEmergencyFundsCountAsLiquid,
    showInvestmentGainsOnDashboard,
    setShowInvestmentGainsOnDashboard,
    includeEstimatedInterestInProjections,
    setIncludeEstimatedInterestInProjections,
    countConfirmedInterestAsIncome,
    setCountConfirmedInterestAsIncome,
    showCryptoAssets,
    setShowCryptoAssets,
    confirmBeforeEmergencyWithdrawals,
    setConfirmBeforeEmergencyWithdrawals,
    showWealthWidgetOnDashboard,
    setShowWealthWidgetOnDashboard,
  } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Wealth
        </CardTitle>
        <CardDescription>Configure how emergency funds, savings, and investments behave</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Default wealth currency</Label>
          <Select
            value={defaultWealthCurrency || currency}
            onValueChange={(v) => setDefaultWealthCurrency(v === currency ? "" : v)}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Used as the default when creating new wealth accounts.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emergencyLiquid" className="cursor-pointer">
              Emergency funds count as liquid cash
            </Label>
            <p className="text-xs text-muted-foreground">
              Include emergency reserves when showing available cash elsewhere in the app
            </p>
          </div>
          <Switch
            id="emergencyLiquid"
            checked={emergencyFundsCountAsLiquid}
            onCheckedChange={setEmergencyFundsCountAsLiquid}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showGainsOnDashboard" className="cursor-pointer">
              Show investment gains on main dashboard
            </Label>
            <p className="text-xs text-muted-foreground">
              Surface portfolio performance alongside your budgeting summary
            </p>
          </div>
          <Switch
            id="showGainsOnDashboard"
            checked={showInvestmentGainsOnDashboard}
            onCheckedChange={setShowInvestmentGainsOnDashboard}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="includeEstimatedInterest" className="cursor-pointer">
              Include estimated interest in projections
            </Label>
            <p className="text-xs text-muted-foreground">
              Factor APY/APR estimates into wealth totals — clearly labeled as estimates
            </p>
          </div>
          <Switch
            id="includeEstimatedInterest"
            checked={includeEstimatedInterestInProjections}
            onCheckedChange={setIncludeEstimatedInterestInProjections}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="countInterestAsIncome" className="cursor-pointer">
              Count confirmed interest/dividends as budget income
            </Label>
            <p className="text-xs text-muted-foreground">
              Off by default — confirmed interest and dividends stay wealth-only
            </p>
          </div>
          <Switch
            id="countInterestAsIncome"
            checked={countConfirmedInterestAsIncome}
            onCheckedChange={setCountConfirmedInterestAsIncome}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showCrypto" className="cursor-pointer">
              Show crypto assets
            </Label>
            <p className="text-xs text-muted-foreground">
              Hide digital-asset accounts and holdings from Wealth views
            </p>
          </div>
          <Switch id="showCrypto" checked={showCryptoAssets} onCheckedChange={setShowCryptoAssets} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="confirmWithdrawals" className="cursor-pointer">
              Confirm before emergency withdrawals
            </Label>
            <p className="text-xs text-muted-foreground">
              Require an extra confirmation step when recording an emergency withdrawal
            </p>
          </div>
          <Switch
            id="confirmWithdrawals"
            checked={confirmBeforeEmergencyWithdrawals}
            onCheckedChange={setConfirmBeforeEmergencyWithdrawals}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="showWealthWidget" className="cursor-pointer">
              Show Wealth widget on dashboard
            </Label>
            <p className="text-xs text-muted-foreground">
              Display a summary card on the main Dashboard with a link to Wealth
            </p>
          </div>
          <Switch
            id="showWealthWidget"
            checked={showWealthWidgetOnDashboard}
            onCheckedChange={setShowWealthWidgetOnDashboard}
          />
        </div>

        <p className="text-[11px] text-muted-foreground pt-1 border-t">
          Wealth accounts, emergency funds, and investment activity are included in JSON export and
          import alongside your budgeting data.
        </p>
      </CardContent>
    </Card>
  );
}

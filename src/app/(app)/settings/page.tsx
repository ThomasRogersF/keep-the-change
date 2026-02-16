"use client";

import { PageHeader } from "@/components/layout/page-header";
import { SettingsContent } from "@/components/settings/settings-content";

export default function SettingsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences"
      />
      <SettingsContent />
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences"
      />
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appearance</CardTitle>
            <CardDescription>Customize the look and feel</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Theme settings coming soon.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data</CardTitle>
            <CardDescription>Import, export, and manage your data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Data management coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

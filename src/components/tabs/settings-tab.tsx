
"use client";

import { UserProfileForm } from "@/components/settings/user-profile-form";
import { CurrencySelector } from "@/components/settings/currency-selector";

export function SettingsTab() {
  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <UserProfileForm />
      <CurrencySelector />
    </div>
  );
}

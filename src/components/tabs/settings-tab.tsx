

"use client";

import { UserProfileForm } from "@/components/settings/user-profile-form";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import { CurrencySelector } from "@/components/settings/currency-selector";
import { useData } from "@/contexts/DataContext";
import { ProjectSettingsForm } from "@/components/settings/project-settings-form";

interface SettingsTabProps {
    onGoToDashboard: () => void;
}

export function SettingsTab({ onGoToDashboard }: SettingsTabProps) {
  const { currentProject } = useData();
  return (
    <div className="space-y-6">
        <div className="flex justify-start">
            <Button onClick={onGoToDashboard} variant="outline" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4"/>
                Go to Dashboard
            </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <UserProfileForm />
            <ProjectSettingsForm />
            <CurrencySelector />
        </div>
    </div>
  );
}

    
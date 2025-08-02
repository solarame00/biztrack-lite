
"use client";

import { useData } from "@/contexts/DataContext";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction } from "@/types";

interface DashboardTabProps {
  onDrillDown: (transactionType: 'expense' | 'cash-in') => void;
}

export function DashboardTab({ onDrillDown }: DashboardTabProps) {
  const { currentProjectId } = useData();

  if (!currentProjectId) {
    // This case is handled by the main page with a more prominent banner.
    // Returning null here to avoid duplicate "select a project" messages.
    return null;
  }

  return (
    <div className="flex-grow flex flex-col md:-mt-12">
        <HomeDashboard onDrillDown={onDrillDown} />
    </div>
  );
}

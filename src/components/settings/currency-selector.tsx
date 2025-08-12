
"use client";

import { useData } from "@/contexts/DataContext";
import type { Currency } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { availableCurrencies } from "@/lib/currency-utils";
import { Coins } from "lucide-react";


export function CurrencySelector() {
  const { currency, currentProject } = useData();

  if (!currentProject) {
    return (
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Coins className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Project Currency</CardTitle>
            </div>
            <CardDescription>Select a project to see its currency setting.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No project selected.</p>
          </CardContent>
        </Card>
    )
  }


  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Project Currency</CardTitle>
        </div>
        <CardDescription>The currency for the project <span className="font-semibold text-primary">{currentProject.name}</span> is set to:</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="currency-display">Project Currency</Label>
          <Input id="currency-display" value={availableCurrencies.find(c => c.value === currency)?.label || currency} disabled />
          <p className="text-sm text-muted-foreground pt-2">Currency is set when a project is created and cannot be changed later.</p>
        </div>
      </CardContent>
    </Card>
  );
}

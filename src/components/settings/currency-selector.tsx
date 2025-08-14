
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { availableCurrencies } from "@/lib/currency-utils";
import { Coins, Loader2 } from "lucide-react";
import { useState } from "react";


export function CurrencySelector() {
  const { currency, currentProject, updateProjectSettings } = useData();
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleCurrencyChange = async (newCurrency: Currency) => {
    if (newCurrency === currentProject.currency) return;
    setIsUpdating(true);
    await updateProjectSettings(currentProject.id, { currency: newCurrency });
    setIsUpdating(false);
  }


  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Project Currency</CardTitle>
        </div>
        <CardDescription>
          The currency for the project <span className="font-semibold text-primary">{currentProject.name}</span>.
          Changing this will update how values are displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="currency-select">Currency</Label>
          <div className="flex items-center gap-2">
             <Select 
              value={currency} 
              onValueChange={(value) => handleCurrencyChange(value as Currency)}
              disabled={isUpdating}
             >
              <SelectTrigger id="currency-select">
                <SelectValue placeholder="Select a currency" />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdating && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            Note: This only changes the currency symbol. It does not convert existing transaction amounts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

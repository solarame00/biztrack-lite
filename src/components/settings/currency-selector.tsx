
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
import { Coins } from "lucide-react";


export function CurrencySelector() {
  const { currency, setCurrency } = useData();

  const handleCurrencyChange = (value: string) => {
    setCurrency(value as Currency);
  };

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <CardTitle className="text-xl sm:text-2xl">Currency Settings</CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base">Choose your preferred currency for display across the application.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="currency-select" className="text-sm sm:text-base">Select Currency</Label>
          <Select
            value={currency}
            onValueChange={handleCurrencyChange}
          >
            <SelectTrigger id="currency-select" className="w-full sm:w-[280px] md:w-[350px]">
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
        </div>
      </CardContent>
    </Card>
  );
}

    
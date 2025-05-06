"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, DollarSign, Landmark, Package, Scale } from "lucide-react";
import { useState, useEffect } from "react";

// Mock data - replace with actual data fetching in a real application
const mockData = {
  realCash: 5000,
  totalExpenses: 1200,
  totalAssets: 15000,
};

// Simulate data fetching
const fetchData = async () => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  return mockData;
};


export function HomeDashboard() {
  const [realCash, setRealCash] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchData(); // In a real app, this would fetch from backend
      setRealCash(data.realCash);
      setTotalExpenses(data.totalExpenses);
      setTotalAssets(data.totalAssets);
      setNetBalance(data.realCash + data.totalAssets - data.totalExpenses);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-md rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Loading...</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Fetching data...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }


  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
      <Card className="shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Real Cash
          </CardTitle>
          <Landmark className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ${realCash.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Current liquid cash on hand</p>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Expenses
          </CardTitle>
          <TrendingDown className="h-5 w-5 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            ${totalExpenses.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Sum of all expenses logged</p>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Assets
          </CardTitle>
          <Package className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            ${totalAssets.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Combined value of all listed assets</p>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-lg bg-primary/10 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary-foreground">
            Net Balance
          </CardTitle>
          <Scale className="h-5 w-5 text-primary-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ${netBalance.toLocaleString()}
          </div>
          <p className="text-xs text-primary-foreground/80">Cash + Assets - Expenses</p>
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, DollarSign, Landmark, Package, Scale } from "lucide-react";
import { useState, useEffect } from "react";

// In a real application, you would fetch data from a backend (e.g., Firebase)
// For now, we'll initialize with zeros and remove the mock data.
const fetchData = async () => {
  // This function would normally fetch data from your backend.
  // For this step, we are just ensuring the dashboard starts with 0s.
  // In a subsequent step, you would integrate Firebase here.
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate a very short delay
  return {
    realCash: 0,
    totalExpenses: 0,
    totalAssets: 0,
  };
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
      // Replace this with actual data fetching logic (e.g., from Firebase)
      const data = await fetchData(); 
      setRealCash(data.realCash);
      setTotalExpenses(data.totalExpenses);
      setTotalAssets(data.totalAssets);
      setNetBalance(data.realCash + data.totalAssets - data.totalExpenses);
      setLoading(false);
    };
    loadData();
  }, []); // This useEffect will run once when the component mounts

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-md rounded-lg animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Loading...</CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted-foreground/10 rounded w-1/2"></div>
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
          <CardTitle className="text-sm font-medium text-primary">
            Net Balance
          </CardTitle>
          <Scale className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ${netBalance.toLocaleString()}
          </div>
          <p className="text-xs text-primary/80">Cash + Assets - Expenses</p>
        </CardContent>
      </Card>
    </div>
  );
}

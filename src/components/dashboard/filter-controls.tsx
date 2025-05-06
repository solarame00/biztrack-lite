"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Filter } from "lucide-react";

type FilterPeriod = "today" | "thisWeek" | "thisMonth";

export function FilterControls() {
  const [activeFilter, setActiveFilter] = useState<FilterPeriod>("thisMonth");

  const handleFilterChange = (period: FilterPeriod) => {
    setActiveFilter(period);
    // In a real app, this would trigger a data refetch with the new filter
    console.log("Filtering by:", period);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 p-4 border rounded-lg shadow-sm bg-card">
      <div className="flex items-center mb-4 sm:mb-0">
        <Filter className="h-5 w-5 mr-2 text-primary" />
        <h3 className="text-lg font-semibold">Filter Data</h3>
      </div>
      <div className="flex space-x-2">
        {(["today", "thisWeek", "thisMonth"] as FilterPeriod[]).map((period) => (
          <Button
            key={period}
            variant={activeFilter === period ? "default" : "outline"}
            onClick={() => handleFilterChange(period)}
            className="capitalize transition-all duration-200"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {period.replace(/([A-Z])/g, ' $1').trim()}
          </Button>
        ))}
      </div>
    </div>
  );
}

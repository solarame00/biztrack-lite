
"use client";

import type { ReactNode } from 'react';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Filter, ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useData } from "@/contexts/DataContext";
import type { FilterPeriod, DateFilter } from "@/types";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const periodOptions: { value: FilterPeriod; label: string }[] = [
  { value: "allTime", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisMonth", label: "This Month" },
];

export function FilterControls() {
  const { filter, setFilter } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>(filter.period || "allTime");
  const [specificDate, setSpecificDate] = useState<Date | undefined>(filter.specificDate);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    filter.startDate && filter.endDate ? { from: filter.startDate, to: filter.endDate } : undefined
  );
  const [activeFilterType, setActiveFilterType] = useState<"period" | "date" | "range">(filter.type || "period");


  useEffect(() => {
    if (filter.type === "period") setSelectedPeriod(filter.period || "allTime");
    if (filter.type === "date") setSpecificDate(filter.specificDate);
    if (filter.type === "range") setDateRange(filter.startDate && filter.endDate ? { from: filter.startDate, to: filter.endDate } : undefined);
    setActiveFilterType(filter.type || "period");
  }, [filter]);

  const handlePeriodChange = (period: FilterPeriod) => {
    setSelectedPeriod(period);
    setSpecificDate(undefined);
    setDateRange(undefined);
    setActiveFilterType("period");
    setFilter({ type: "period", period });
  };

  const handleSpecificDateChange = (date: Date | undefined) => {
    setSpecificDate(date);
    setSelectedPeriod("allTime"); // Reset period filter
    setDateRange(undefined);
    setActiveFilterType("date");
    if (date) {
      setFilter({ type: "date", specificDate: date });
    } else { // If date is cleared, revert to "allTime"
      handlePeriodChange("allTime");
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSelectedPeriod("allTime"); // Reset period filter
    setSpecificDate(undefined);
    setActiveFilterType("range");
    if (range?.from && range?.to) {
      setFilter({ type: "range", startDate: range.from, endDate: range.to });
    } else if (!range?.from && !range?.to) { // If range is cleared
        handlePeriodChange("allTime");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 p-4 border rounded-lg shadow-sm bg-card">
      <div className="flex items-center mb-4 sm:mb-0">
        <Filter className="h-5 w-5 mr-2 text-primary" />
        <h3 className="text-lg font-semibold">Filter Data</h3>
      </div>
      
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        {/* Period Filter Buttons */}
        {periodOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={activeFilterType === "period" && selectedPeriod === opt.value ? "default" : "outline"}
            onClick={() => handlePeriodChange(opt.value)}
            className="capitalize transition-all duration-200 flex-grow sm:flex-grow-0"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {opt.label}
          </Button>
        ))}

        {/* Specific Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={activeFilterType === "date" ? "default" : "outline"}
              className={cn(
                "w-full sm:w-[200px] justify-start text-left font-normal",
                !specificDate && activeFilterType !== "date" && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {activeFilterType === "date" && specificDate ? format(specificDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={specificDate}
              onSelect={handleSpecificDateChange}
              initialFocus
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            />
          </PopoverContent>
        </Popover>

        {/* Date Range Picker */}
         <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-range"
              variant={activeFilterType === "range" ? "default" : "outline"}
              className={cn(
                "w-full sm:w-[300px] justify-start text-left font-normal",
                !dateRange && activeFilterType !== "range" && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

    
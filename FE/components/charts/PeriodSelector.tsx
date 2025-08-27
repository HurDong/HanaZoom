"use client";

import { Button } from "@/components/ui/button";
import { ChartPeriod } from "@/types/chart";
import { Calendar, CalendarDays, CalendarRange } from "lucide-react";

interface PeriodSelectorProps {
  selectedPeriod: ChartPeriod;
  onPeriodChange: (period: ChartPeriod) => void;
  className?: string;
}

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  className,
}: PeriodSelectorProps) {
  const periods = [
    {
      value: "daily" as ChartPeriod,
      label: "일봉",
      icon: CalendarDays,
      description: "일별 가격 변동",
    },
    {
      value: "weekly" as ChartPeriod,
      label: "주봉",
      icon: CalendarRange,
      description: "주별 가격 변동",
    },
    {
      value: "monthly" as ChartPeriod,
      label: "월봉",
      icon: Calendar,
      description: "월별 가격 변동",
    },
  ];

  return (
    <div
      className={`flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 ${className}`}
    >
      {periods.map((period) => {
        const Icon = period.icon;
        const isSelected = selectedPeriod === period.value;

        return (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`flex-1 px-4 py-2 rounded transition-all text-sm font-medium flex items-center justify-center gap-2 ${
              isSelected
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            title={period.description}
          >
            <Icon className="w-4 h-4" />
            {period.label}
          </button>
        );
      })}
    </div>
  );
}

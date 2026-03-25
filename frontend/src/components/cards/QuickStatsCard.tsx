"use client";

import { BarChart3 } from "lucide-react";

interface QuickStatsProps {
  content: {
    stats: { label: string; value: string }[];
  };
}

export default function QuickStatsCard({ content }: QuickStatsProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
          Quick Stats
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {content.stats.map((stat, i) => (
          <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {stat.value}
            </p>
            <p className="text-[11px] text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

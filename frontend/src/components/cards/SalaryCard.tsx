"use client";

import { DollarSign } from "lucide-react";

interface SalaryProps {
  content: {
    range: string;
    average?: string;
    source_note?: string;
    currency?: string;
  };
}

export default function SalaryCard({ content }: SalaryProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Salary Range</h3>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{content.range}</p>
      {content.average && (
        <p className="text-sm text-gray-400 mt-1">Average: {content.average}</p>
      )}
      {content.source_note && (
        <p className="text-xs text-gray-400 mt-2">{content.source_note}</p>
      )}
    </div>
  );
}

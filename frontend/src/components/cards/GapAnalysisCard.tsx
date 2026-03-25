"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";

interface GapAnalysisProps {
  content: {
    gaps: {
      skill: string;
      importance: string;
      suggestion: string;
      resource_url?: string;
    }[];
  };
}

export default function GapAnalysisCard({ content }: GapAnalysisProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
          Gap Analysis
        </h3>
      </div>
      <div className="space-y-3">
        {content.gaps.map((gap, i) => (
          <div key={i} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3 py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {gap.skill}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 capitalize font-medium">
                {gap.importance}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{gap.suggestion}</p>
            {gap.resource_url && (
              <a
                href={gap.resource_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-900 dark:text-gray-100 hover:underline mt-1 font-medium"
              >
                Learn this
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

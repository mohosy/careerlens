"use client";

import { Target } from "lucide-react";

interface MatchScoreProps {
  content: {
    score: number;
    strengths: string[];
    gaps: string[];
    summary: string;
  };
}

export default function MatchScoreCard({ content }: MatchScoreProps) {
  const score = content.score;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4 text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
          Resume Match Score
        </h3>
      </div>

      <div className="flex items-center gap-5">
        {/* Circular gauge */}
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-gray-100 dark:text-gray-800"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="text-gray-900 dark:text-white transition-all duration-1000"
              stroke="currentColor"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {score}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
            {content.summary}
          </p>
          {content.strengths.length > 0 && (
            <div className="mb-2">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Strengths
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {content.strengths.slice(0, 3).map((s, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {content.gaps.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                Gaps
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {content.gaps.slice(0, 3).map((g, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

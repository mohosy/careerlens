"use client";

import { HelpCircle, Lightbulb } from "lucide-react";
import { useState } from "react";

interface InterviewQuestionProps {
  content: {
    question: string;
    context?: string;
    difficulty?: string;
    tips?: string;
  };
  source_url?: string;
}

const difficultyStyles: Record<string, string> = {
  easy: "bg-gray-100 dark:bg-gray-800 text-gray-500",
  medium: "bg-gray-100 dark:bg-gray-800 text-gray-500",
  hard: "bg-gray-100 dark:bg-gray-800 text-gray-500",
};

export default function InterviewQuestionCard({
  content,
  source_url,
}: InterviewQuestionProps) {
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-start gap-2 mb-2">
        <HelpCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Interview Question
            </span>
            {content.difficulty && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${difficultyStyles[content.difficulty.toLowerCase()] || difficultyStyles.medium}`}
              >
                {content.difficulty}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
            {content.question}
          </p>
        </div>
      </div>

      {content.context && (
        <p className="text-xs text-gray-400 mt-2 ml-6">{content.context}</p>
      )}

      {content.tips && (
        <div className="mt-3 ml-6">
          <button
            onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-1 text-xs text-gray-900 dark:text-gray-100 hover:underline font-medium"
          >
            <Lightbulb className="w-3 h-3" />
            {showTips ? "Hide tips" : "Show tips"}
          </button>
          {showTips && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {content.tips}
            </p>
          )}
        </div>
      )}

      {source_url && (
        <a
          href={source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mt-2 ml-6"
        >
          View source
        </a>
      )}
    </div>
  );
}

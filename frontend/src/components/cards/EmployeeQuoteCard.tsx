"use client";

import { Quote } from "lucide-react";

interface EmployeeQuoteProps {
  content: {
    quote: string;
    author?: string;
    role?: string;
    platform?: string;
    sentiment?: string;
  };
  source_url?: string;
}

export default function EmployeeQuoteCard({
  content,
  source_url,
}: EmployeeQuoteProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <Quote className="w-4 h-4 text-gray-200 dark:text-gray-700 mb-2" />
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
        &ldquo;{content.quote}&rdquo;
      </p>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {content.author && <span>{content.author}</span>}
          {content.role && <span> &middot; {content.role}</span>}
        </div>
        {source_url && (
          <a
            href={source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-900 dark:text-gray-100 hover:underline font-medium"
          >
            {content.platform || "Source"}
          </a>
        )}
      </div>
    </div>
  );
}

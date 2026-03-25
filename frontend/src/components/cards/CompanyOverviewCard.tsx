"use client";

import { Building2, MapPin, Users, Globe } from "lucide-react";

interface CompanyOverviewProps {
  content: {
    description: string;
    size?: string;
    industry?: string;
    headquarters?: string;
    founded?: string;
    website?: string;
    logo_query?: string;
  };
  title: string;
}

export default function CompanyOverviewCard({ content, title }: CompanyOverviewProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {content.industry && (
            <span className="text-xs text-gray-400">{content.industry}</span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
        {content.description}
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
        {content.headquarters && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {content.headquarters}
          </div>
        )}
        {content.size && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {content.size}
          </div>
        )}
        {content.founded && <div>Founded {content.founded}</div>}
        {content.website && (
          <a
            href={content.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100 hover:underline"
          >
            <Globe className="w-3.5 h-3.5" />
            Website
          </a>
        )}
      </div>
    </div>
  );
}

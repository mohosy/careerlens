"use client";

import { Map, ExternalLink, Clock } from "lucide-react";

interface SkillsRoadmapProps {
  content: {
    skills: {
      name: string;
      priority: string;
      time_estimate?: string;
      resources?: string[];
    }[];
  };
}

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function SkillsRoadmapCard({ content }: SkillsRoadmapProps) {
  const sorted = [...content.skills].sort(
    (a, b) =>
      (priorityOrder[a.priority?.toLowerCase()] ?? 1) -
      (priorityOrder[b.priority?.toLowerCase()] ?? 1)
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Map className="w-4 h-4 text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
          Skills Roadmap
        </h3>
      </div>
      <div className="space-y-2">
        {sorted.map((skill, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-3"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {skill.name}
              </span>
              {skill.time_estimate && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  {skill.time_estimate}
                </span>
              )}
            </div>
            {skill.resources && skill.resources.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {skill.resources.map((resource, j) => (
                  <a
                    key={j}
                    href={resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-900 dark:text-gray-100 hover:underline font-medium"
                  >
                    Resource {j + 1}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

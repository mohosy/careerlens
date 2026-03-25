"use client";

import { Play } from "lucide-react";

interface YouTubeVideoProps {
  content: {
    video_id: string;
    title: string;
    channel?: string;
    thumbnail?: string;
    description?: string;
  };
}

export default function YouTubeVideoCard({ content }: YouTubeVideoProps) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
      <a
        href={`https://www.youtube.com/watch?v=${content.video_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
          {content.thumbnail ? (
            <img
              src={content.thumbnail}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </div>
          </div>
        </div>
      </a>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
          {content.title}
        </h4>
        {content.channel && (
          <p className="text-xs text-gray-400 mt-1">{content.channel}</p>
        )}
      </div>
    </div>
  );
}

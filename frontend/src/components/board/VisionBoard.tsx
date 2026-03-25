"use client";

import Masonry from "react-masonry-css";
import CompanyOverviewCard from "@/components/cards/CompanyOverviewCard";
import SalaryCard from "@/components/cards/SalaryCard";
import EmployeeQuoteCard from "@/components/cards/EmployeeQuoteCard";
import InterviewQuestionCard from "@/components/cards/InterviewQuestionCard";
import YouTubeVideoCard from "@/components/cards/YouTubeVideoCard";
import MatchScoreCard from "@/components/cards/MatchScoreCard";
import GapAnalysisCard from "@/components/cards/GapAnalysisCard";
import SkillsRoadmapCard from "@/components/cards/SkillsRoadmapCard";
import QuickStatsCard from "@/components/cards/QuickStatsCard";

interface Card {
  type: string;
  title: string;
  content: Record<string, unknown>;
  source_url?: string;
}

interface VisionBoardProps {
  cards: Card[];
}

// Define the order cards appear in (priority cards first)
const typeOrder: Record<string, number> = {
  company_overview: 0,
  match_score: 1,
  salary: 2,
  quick_stats: 3,
  gap_analysis: 4,
  skills_roadmap: 5,
  interview_question: 6,
  employee_quote: 7,
  youtube_video: 8,
};

const breakpointColumns = {
  default: 3,
  1100: 2,
  700: 1,
};

function renderCard(card: Card, index: number) {
  const key = `${card.type}-${index}`;
  const content = card.content as never;

  switch (card.type) {
    case "company_overview":
      return <CompanyOverviewCard key={key} content={content} title={card.title} />;
    case "salary":
      return <SalaryCard key={key} content={content} />;
    case "employee_quote":
      return (
        <EmployeeQuoteCard
          key={key}
          content={content}
          source_url={card.source_url}
        />
      );
    case "interview_question":
      return (
        <InterviewQuestionCard
          key={key}
          content={content}
          source_url={card.source_url}
        />
      );
    case "youtube_video":
      return <YouTubeVideoCard key={key} content={content} />;
    case "match_score":
      return <MatchScoreCard key={key} content={content} />;
    case "gap_analysis":
      return <GapAnalysisCard key={key} content={content} />;
    case "skills_roadmap":
      return <SkillsRoadmapCard key={key} content={content} />;
    case "quick_stats":
      return <QuickStatsCard key={key} content={content} />;
    default:
      return null;
  }
}

export default function VisionBoard({ cards }: VisionBoardProps) {
  const sorted = [...cards].sort(
    (a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99)
  );

  return (
    <Masonry
      breakpointCols={breakpointColumns}
      className="flex -ml-4 w-auto"
      columnClassName="pl-4 bg-clip-padding"
    >
      {sorted.map((card, i) => (
        <div key={`${card.type}-${i}`} className="mb-4">
          {renderCard(card, i)}
        </div>
      ))}
    </Masonry>
  );
}

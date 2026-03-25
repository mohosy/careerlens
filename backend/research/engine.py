import asyncio
import json
import traceback
from typing import Optional

from models.schemas import ResumeData, JobData
from research.query_expander import expand_queries
from research.searcher import (
    search_web,
    search_youtube,
    search_reddit,
    search_glassdoor,
    fetch_page_content,
)
from research.synthesizer import synthesize_research

# In-memory results store (board_id -> cards)
_results_store: dict[str, list[dict]] = {}


class ResearchEngine:
    """Orchestrates the full deep research pipeline."""

    def __init__(self, board_id: str, progress_queue: asyncio.Queue):
        self.board_id = board_id
        self.queue = progress_queue

    async def _emit(self, message: str, stage: str, progress: float):
        await self.queue.put(
            json.dumps(
                {
                    "board_id": self.board_id,
                    "message": message,
                    "stage": stage,
                    "progress": round(progress, 2),
                }
            )
        )

    async def run(self, resume: ResumeData, job: JobData):
        try:
            await self._emit(
                f"Starting deep research on {job.company} — {job.role}...",
                "searching", 0.0,
            )

            # Step 1: Expand queries
            queries = expand_queries(job.company, job.role)
            await self._emit(
                f"Generated {sum(len(v) for v in queries.values() if isinstance(v, list))} search queries",
                "searching", 0.05,
            )

            # Step 2: Fan out searches in parallel
            web_results, youtube_results, reddit_results, glassdoor_results = (
                await self._run_searches(queries)
            )

            total_results = (
                len(web_results)
                + len(youtube_results)
                + len(reddit_results)
                + len(glassdoor_results)
            )
            await self._emit(
                f"Found {total_results} results across all sources",
                "searching", 0.5,
            )

            # Step 3: Deep scrape top results for richer content
            await self._emit(
                "Deep-diving into the most relevant sources...",
                "analyzing", 0.55,
            )
            scraped = await self._deep_scrape(web_results, reddit_results, glassdoor_results)
            await self._emit(
                f"Analyzed {len(scraped)} pages in depth",
                "analyzing", 0.7,
            )

            # Step 4: AI synthesis
            await self._emit(
                "Synthesizing all research into your vision board...",
                "generating", 0.75,
            )
            cards = await synthesize_research(
                resume, job,
                web_results, youtube_results,
                reddit_results, glassdoor_results,
                scraped,
            )
            await self._emit(
                f"Generated {len(cards)} vision board cards",
                "generating", 0.95,
            )

            # Store results
            _results_store[self.board_id] = cards

            await self._emit("Research complete!", "generating", 1.0)

        except Exception as e:
            await self._emit(f"Error: {str(e)}", "error", -1)
            traceback.print_exc()

        finally:
            # Send sentinel to close the SSE stream
            await self.queue.put(None)

    async def _run_searches(self, queries: dict) -> tuple[list, list, list, list]:
        """Run all searches in parallel across sources."""
        web_tasks = []
        for q in queries.get("web", []):
            web_tasks.append(self._search_with_progress(search_web, q, "web"))

        yt_tasks = []
        for q in queries.get("youtube", []):
            yt_tasks.append(self._search_with_progress(search_youtube, q, "YouTube"))

        reddit_tasks = []
        for q in queries.get("reddit", []):
            reddit_tasks.append(self._search_with_progress(search_reddit, q, "Reddit"))

        glassdoor_task = self._search_with_progress(
            search_glassdoor,
            queries.get("company", ""),
            "Glassdoor",
            role=queries.get("role"),
        )

        # Run all in parallel
        all_tasks = web_tasks + yt_tasks + reddit_tasks + [glassdoor_task]
        results = await asyncio.gather(*all_tasks, return_exceptions=True)

        # Separate results by source
        web_results = []
        youtube_results = []
        reddit_results = []
        glassdoor_results = []

        idx = 0
        for r in results[:len(web_tasks)]:
            if isinstance(r, list):
                web_results.extend(r)
            idx += 1

        for r in results[len(web_tasks):len(web_tasks) + len(yt_tasks)]:
            if isinstance(r, list):
                youtube_results.extend(r)

        for r in results[len(web_tasks) + len(yt_tasks):len(web_tasks) + len(yt_tasks) + len(reddit_tasks)]:
            if isinstance(r, list):
                reddit_results.extend(r)

        last = results[-1]
        if isinstance(last, list):
            glassdoor_results.extend(last)

        # Deduplicate by URL
        web_results = _dedupe(web_results)
        reddit_results = _dedupe(reddit_results)

        return web_results, youtube_results, reddit_results, glassdoor_results

    async def _search_with_progress(self, search_fn, query, source, **kwargs):
        """Run a search function and emit progress."""
        await self._emit(f"Searching {source}: \"{query}\"...", "searching", 0.1)
        try:
            if kwargs:
                return await search_fn(query, **kwargs)
            return await search_fn(query)
        except Exception as e:
            await self._emit(f"Warning: {source} search failed for \"{query}\": {str(e)}", "searching", 0.1)
            return []

    async def _deep_scrape(
        self,
        web_results: list[dict],
        reddit_results: list[dict],
        glassdoor_results: list[dict],
    ) -> list[dict]:
        """Scrape top results for deeper content."""
        # Pick the most promising URLs to deep-scrape
        urls_to_scrape = []

        # Top 3 web results
        for r in web_results[:3]:
            if r.get("url"):
                urls_to_scrape.append(r["url"])

        # Top 3 Reddit posts
        for r in sorted(reddit_results, key=lambda x: x.get("score", 0), reverse=True)[:3]:
            if r.get("url"):
                urls_to_scrape.append(r["url"] + ".json")

        # Top 2 Glassdoor results
        for r in glassdoor_results[:2]:
            if r.get("url"):
                urls_to_scrape.append(r["url"])

        # Scrape in parallel
        tasks = [fetch_page_content(url) for url in urls_to_scrape]
        contents = await asyncio.gather(*tasks, return_exceptions=True)

        scraped = []
        for url, content in zip(urls_to_scrape, contents):
            if isinstance(content, str) and content.strip():
                scraped.append({"url": url, "content": content})

        return scraped

    @staticmethod
    def get_results(board_id: str) -> Optional[list[dict]]:
        return _results_store.get(board_id)


def _dedupe(results: list[dict]) -> list[dict]:
    """Remove duplicate results by URL."""
    seen = set()
    deduped = []
    for r in results:
        url = r.get("url", "")
        if url not in seen:
            seen.add(url)
            deduped.append(r)
    return deduped

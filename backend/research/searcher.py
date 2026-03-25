import os
from typing import Optional

import httpx

SERPER_API_KEY = os.getenv("SERPER_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


async def search_web(query: str, num_results: int = 10) -> list[dict]:
    """Search the web via Serper.dev API."""
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"},
            json={"q": query, "num": num_results},
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("organic", []):
        results.append(
            {
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "source": "web",
            }
        )
    return results


async def search_youtube(query: str, max_results: int = 5) -> list[dict]:
    """Search YouTube for relevant videos."""
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": max_results,
                "key": YOUTUBE_API_KEY,
                "relevanceLanguage": "en",
            },
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("items", []):
        video_id = item["id"]["videoId"]
        snippet = item["snippet"]
        results.append(
            {
                "title": snippet.get("title", ""),
                "url": f"https://www.youtube.com/watch?v={video_id}",
                "thumbnail": snippet.get("thumbnails", {})
                .get("high", {})
                .get("url", ""),
                "channel": snippet.get("channelTitle", ""),
                "description": snippet.get("description", ""),
                "video_id": video_id,
                "source": "youtube",
            }
        )
    return results


async def search_reddit(query: str, limit: int = 10) -> list[dict]:
    """Search Reddit using their JSON API."""
    headers = {
        "User-Agent": "CareerLens/1.0 (research tool)"
    }
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        response = await client.get(
            "https://www.reddit.com/search.json",
            params={"q": query, "sort": "relevance", "limit": limit, "t": "all"},
            headers=headers,
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for child in data.get("data", {}).get("children", []):
        post = child.get("data", {})
        results.append(
            {
                "title": post.get("title", ""),
                "url": f"https://reddit.com{post.get('permalink', '')}",
                "snippet": post.get("selftext", "")[:500],
                "subreddit": post.get("subreddit", ""),
                "score": post.get("score", 0),
                "num_comments": post.get("num_comments", 0),
                "source": "reddit",
            }
        )
    return results


async def search_glassdoor(company: str, role: Optional[str] = None) -> list[dict]:
    """Search for Glassdoor reviews/interviews via web search."""
    queries = [
        f"site:glassdoor.com {company} reviews",
        f"site:glassdoor.com {company} interview questions",
    ]
    if role:
        queries.append(f"site:glassdoor.com {company} {role} interview")

    all_results = []
    for query in queries:
        results = await search_web(query, num_results=5)
        for r in results:
            r["source"] = "glassdoor"
        all_results.extend(results)
    return all_results


async def fetch_page_content(url: str) -> str:
    """Fetch and extract text content from a URL for deeper analysis."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

        from bs4 import BeautifulSoup

        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        text = soup.get_text(separator="\n", strip=True)
        return text[:4000]  # Limit for LLM context
    except Exception:
        return ""

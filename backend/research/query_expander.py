def expand_queries(company: str, role: str) -> dict[str, list[str]]:
    """Generate expanded search queries for different sources.

    Strategy:
    1. Start with the exact company + role combo
    2. Broaden to just company or just role category
    3. Include related role variations
    """
    # Normalize
    company_clean = company.strip()
    role_clean = role.strip()

    # Extract role components (e.g., "Network Engineer Intern" -> ["Network Engineer", "Intern"])
    role_words = role_clean.split()
    is_intern = any(w.lower() in ("intern", "internship") for w in role_words)
    base_role = " ".join(w for w in role_words if w.lower() not in ("intern", "internship"))

    # Build related roles for fallback
    related_roles = _get_related_roles(base_role)

    web_queries = [
        f"{company_clean} {role_clean} experience",
        f"{company_clean} {role_clean} interview",
        f"what is it like to work at {company_clean}",
        f"{company_clean} company culture",
        f"{company_clean} {base_role} day in the life",
    ]

    youtube_queries = [
        f"{company_clean} {role_clean} interview experience",
        f"{company_clean} day in the life",
        f"{company_clean} intern experience" if is_intern else f"{company_clean} employee experience",
        f"{base_role} interview tips",
    ]

    reddit_queries = [
        f"{company_clean} {role_clean}",
        f"{company_clean} interview experience",
        f"{company_clean} work culture review",
    ]

    # Add related role queries as fallbacks
    for related in related_roles[:2]:
        web_queries.append(f"{company_clean} {related} experience")
        reddit_queries.append(f"{company_clean} {related}")
        if is_intern:
            web_queries.append(f"{company_clean} {related} intern")

    return {
        "web": web_queries,
        "youtube": youtube_queries,
        "reddit": reddit_queries,
        "company": company_clean,
        "role": role_clean,
    }


def _get_related_roles(base_role: str) -> list[str]:
    """Map a role to related roles for broadened search."""
    role_lower = base_role.lower()

    role_families = {
        "software engineer": ["software developer", "backend engineer", "frontend engineer", "full stack engineer"],
        "network engineer": ["systems engineer", "infrastructure engineer", "devops engineer", "site reliability engineer"],
        "data scientist": ["data analyst", "machine learning engineer", "data engineer", "analytics engineer"],
        "data engineer": ["data scientist", "analytics engineer", "backend engineer", "data analyst"],
        "product manager": ["program manager", "product owner", "technical program manager"],
        "devops engineer": ["site reliability engineer", "platform engineer", "infrastructure engineer", "cloud engineer"],
        "frontend engineer": ["ui engineer", "web developer", "software engineer", "full stack engineer"],
        "backend engineer": ["software engineer", "systems engineer", "full stack engineer"],
        "machine learning engineer": ["data scientist", "ai engineer", "research engineer"],
        "security engineer": ["cybersecurity analyst", "information security engineer", "security analyst"],
        "cloud engineer": ["devops engineer", "platform engineer", "infrastructure engineer"],
        "systems engineer": ["network engineer", "infrastructure engineer", "platform engineer"],
    }

    for key, related in role_families.items():
        if key in role_lower or role_lower in key:
            return related

    # Default: try swapping common terms
    return [
        base_role.replace("engineer", "developer"),
        base_role.replace("developer", "engineer"),
        f"software engineer",
    ]

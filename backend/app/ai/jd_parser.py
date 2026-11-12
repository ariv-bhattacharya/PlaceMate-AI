import re

from app.ai.skill_extractor import extract_skills, normalize_text


SECTION_KEYWORDS = {
    "responsibilities": [
        "responsibilities",
        "roles and responsibilities",
        "what you will do",
        "job duties",
        "key responsibilities"
    ],
    "requirements": [
        "requirements",
        "qualifications",
        "required qualifications",
        "what we are looking for",
        "skills required",
        "eligibility criteria"
    ],
    "preferred": [
        "preferred qualifications",
        "preferred skills",
        "good to have",
        "nice to have",
        "desired skills"
    ],
    "benefits": [
        "benefits",
        "perks",
        "what we offer"
    ]
}


def clean_jd_text(text: str) -> str:
    """Clean job description text."""

    if not isinstance(text, str):
        raise ValueError("Job description must be provided as text.")

    text = text.replace("\x00", " ")
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def extract_jd_sections(text: str) -> dict:
    """Extract common sections from a job description."""

    sections = {
        "responsibilities": "",
        "requirements": "",
        "preferred": "",
        "benefits": ""
    }

    heading_lookup = {}

    for section, headings in SECTION_KEYWORDS.items():
        for heading in headings:
            heading_lookup[heading.lower()] = section

    current_section = None
    collected = {key: [] for key in sections}

    for line in text.splitlines():
        line = line.strip()

        if not line:
            continue

        normalized = re.sub(r"[:\-\s]+$", "", line.lower()).strip()

        if normalized in heading_lookup:
            current_section = heading_lookup[normalized]
            continue

        if current_section:
            collected[current_section].append(line)

    for key in sections:
        sections[key] = "\n".join(collected[key]).strip()

    return sections


def extract_experience_requirement(text: str) -> str | None:
    """Find simple experience requirements such as 0-2 years."""

    patterns = [
        r"\b\d+\s*[-–to]+\s*\d+\s+years?\s+(?:of\s+)?experience\b",
        r"\b\d+\+?\s+years?\s+(?:of\s+)?experience\b",
        r"\bfresher\b",
        r"\bentry[- ]level\b"
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)

        if match:
            return match.group(0)

    return None


def extract_education_requirement(text: str) -> str | None:
    """Identify common degree requirements."""

    patterns = [
        r"\bB\.?\s?Tech\b",
        r"\bB\.?\s?E\.?\b",
        r"\bM\.?\s?Tech\b",
        r"\bM\.?\s?S\.?\b",
        r"\bM\.?\s?C\.?\s?A\.?\b",
        r"\bMBA\b",
        r"\bBachelor(?:'s)?\s+degree\b",
        r"\bMaster(?:'s)?\s+degree\b",
        r"\bComputer Science\b",
        r"\bInformation Technology\b"
    ]

    found = []

    for pattern in patterns:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            value = match.group(0)

            if value not in found:
                found.append(value)

    return ", ".join(found) if found else None


def parse_job_description(text: str) -> dict:
    """
    Parse a job description.

    Returns extracted skills, requirements and sections.
    """

    cleaned_text = clean_jd_text(text)

    if not cleaned_text:
        raise ValueError("Job description cannot be empty.")

    sections = extract_jd_sections(cleaned_text)

    all_skills = extract_skills(cleaned_text)

    required_text = (
        sections["requirements"] + " " +
        sections["responsibilities"]
    )

    preferred_text = sections["preferred"]

    required_skills = extract_skills(required_text)
    preferred_skills = extract_skills(preferred_text)

    # Skills found in the JD but not in its explicit preferred section
    # are treated as required by this baseline parser.
    if not required_skills:
        required_skills = all_skills.copy()

    return {
        "success": True,
        "text": cleaned_text,
        "sections": sections,
        "skills": all_skills,
        "required_skills": required_skills,
        "preferred_skills": preferred_skills,
        "experience_requirement": extract_experience_requirement(
            cleaned_text
        ),
        "education_requirement": extract_education_requirement(
            cleaned_text
        ),
        "word_count": len(cleaned_text.split())
    }


def parse_jd(text: str) -> dict:
    """Short alias for parse_job_description."""
    return parse_job_description(text)
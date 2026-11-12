import re
from typing import Any


# Canonical skill names and their commonly used variations.
SKILL_ALIASES = {
    "python": ["python", "python3"],
    "java": ["java", "core java"],
    "javascript": ["javascript", "js"],
    "typescript": ["typescript", "ts"],
    "c": ["c programming", "c language"],
    "c++": ["c++", "cpp"],
    "c#": ["c#", "c sharp"],
    "sql": ["sql", "structured query language"],
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "react": ["react", "react.js", "reactjs"],
    "node.js": ["node.js", "nodejs", "node js"],
    "flask": ["flask"],
    "django": ["django"],
    "fastapi": ["fastapi", "fast api"],
    "spring boot": ["spring boot"],
    "rest api": ["rest api", "restful api", "rest apis"],
    "git": ["git", "github"],
    "linux": ["linux"],
    "excel": ["excel", "microsoft excel", "ms excel"],
    "power bi": ["power bi", "powerbi"],
    "tableau": ["tableau"],
    "data analysis": ["data analysis", "data analytics"],
    "data visualization": ["data visualization", "data visualisation"],
    "statistics": ["statistics", "statistical analysis"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "matplotlib": ["matplotlib"],
    "seaborn": ["seaborn"],
    "scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning", "dl"],
    "natural language processing": [
        "natural language processing",
        "nlp"
    ],
    "tensorflow": ["tensorflow"],
    "pytorch": ["pytorch"],
    "keras": ["keras"],
    "generative ai": ["generative ai", "gen ai", "genai"],
    "large language models": ["large language models", "llm", "llms"],
    "rag": ["rag", "retrieval augmented generation"],
    "prompt engineering": ["prompt engineering"],
    "powerpoint": ["powerpoint", "ms powerpoint"],
    "communication": ["communication", "verbal communication"],
    "problem solving": ["problem solving", "problem-solving"],
    "critical thinking": ["critical thinking"],
    "business analysis": ["business analysis", "business analytics"],
    "requirements gathering": ["requirements gathering", "requirement gathering"],
    "documentation": ["documentation", "technical documentation"],
    "a/b testing": ["a/b testing", "ab testing", "split testing"],
    "product analytics": ["product analytics"],
    "agile": ["agile", "agile methodology"],
    "scrum": ["scrum"],
    "jira": ["jira"],
    "testing": ["software testing", "testing"],
    "manual testing": ["manual testing"],
    "automation testing": ["automation testing"],
    "selenium": ["selenium"],
    "pytest": ["pytest"],
    "cybersecurity": ["cybersecurity", "cyber security"],
    "ethical hacking": ["ethical hacking"],
    "penetration testing": ["penetration testing", "pentesting"],
    "networking": ["computer networking", "networking"],
    "vulnerability assessment": ["vulnerability assessment"],
    "risk assessment": ["risk assessment"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure", "microsoft azure"],
    "google cloud": ["google cloud", "gcp"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "ci/cd": ["ci/cd", "continuous integration", "continuous deployment"],
    "postgresql": ["postgresql", "postgres"],
    "mysql": ["mysql"],
    "mongodb": ["mongodb", "mongo db"],
    "redis": ["redis"],
    "data structures": ["data structures", "dsa"],
    "algorithms": ["algorithms"],
    "object oriented programming": [
        "object oriented programming",
        "oops",
        "oop"
    ],
    "dbms": ["dbms", "database management systems"],
    "operating systems": ["operating systems", "os"],
}


def normalize_text(text: Any) -> str:
    """Convert input into clean lowercase text."""
    if text is None:
        return ""

    if isinstance(text, (list, tuple, set)):
        text = " ".join(str(item) for item in text)

    return re.sub(r"\s+", " ", str(text).lower()).strip()


def normalize_skill(skill: str) -> str:
    """Convert a skill variation into its canonical name."""
    value = normalize_text(skill)

    if not value:
        return ""

    for canonical, aliases in SKILL_ALIASES.items():
        if value == canonical or value in aliases:
            return canonical

    return value


def _contains_phrase(text: str, phrase: str) -> bool:
    """Match a phrase without matching it inside unrelated words."""
    pattern = r"(?<![a-zA-Z0-9+#])" + re.escape(phrase) + r"(?![a-zA-Z0-9+#])"
    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def extract_skills(text: Any) -> list[str]:
    """
    Extract known skills from text.

    Returns a sorted list of canonical skill names.
    """
    content = normalize_text(text)

    if not content:
        return []

    found = set()

    for canonical, aliases in SKILL_ALIASES.items():
        candidates = set(aliases + [canonical])

        for alias in candidates:
            if _contains_phrase(content, alias):
                found.add(canonical)
                break

    return sorted(found)


def extract_skills_from_list(values: Any) -> list[str]:
    """Normalize skills already supplied as a list or comma-separated string."""
    if not values:
        return []

    if isinstance(values, str):
        values = re.split(r"[,;\n|]", values)

    if not isinstance(values, (list, tuple, set)):
        values = [values]

    result = set()

    for value in values:
        skill = normalize_skill(str(value))

        if skill:
            result.add(skill)

    return sorted(result)


def get_skill_dictionary() -> dict:
    """Return the skill dictionary for debugging or API use."""
    return {
        skill: list(aliases)
        for skill, aliases in SKILL_ALIASES.items()
    }
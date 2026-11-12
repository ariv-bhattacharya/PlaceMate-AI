from app.ai.skill_extractor import (
    extract_skills,
    extract_skills_from_list,
    normalize_text
)


def _get_text(data) -> str:
    """Get text from either a string or a parsed dictionary."""

    if isinstance(data, str):
        return data

    if isinstance(data, dict):
        return str(data.get("text", ""))

    return ""


def _get_skills(data) -> list[str]:
    """Get skills from parsed data or extract them from raw text."""

    if isinstance(data, dict):
        skills = data.get("skills", [])

        if skills:
            return extract_skills_from_list(skills)

        return extract_skills(_get_text(data))

    if isinstance(data, str):
        return extract_skills(data)

    return []


def calculate_skill_match(
    resume_skills: list[str],
    required_skills: list[str],
    preferred_skills: list[str] | None = None
) -> dict:
    """Calculate skill overlap between a resume and job description."""

    resume_set = set(extract_skills_from_list(resume_skills))
    required_set = set(extract_skills_from_list(required_skills))
    preferred_set = set(extract_skills_from_list(preferred_skills or []))

    matched_required = sorted(resume_set & required_set)
    missing_required = sorted(required_set - resume_set)

    matched_preferred = sorted(resume_set & preferred_set)
    missing_preferred = sorted(preferred_set - resume_set)

    required_score = (
        len(matched_required) / len(required_set) * 100
        if required_set else 0
    )

    preferred_score = (
        len(matched_preferred) / len(preferred_set) * 100
        if preferred_set else None
    )

    return {
        "required_score": round(required_score, 2),
        "preferred_score": (
            round(preferred_score, 2)
            if preferred_score is not None else None
        ),
        "matched_required_skills": matched_required,
        "missing_required_skills": missing_required,
        "matched_preferred_skills": matched_preferred,
        "missing_preferred_skills": missing_preferred
    }


def calculate_text_similarity(resume_text: str, jd_text: str) -> float:
    """
    Calculate TF-IDF cosine similarity.

    Returns 0 if scikit-learn is unavailable or text is insufficient.
    """

    resume_text = normalize_text(resume_text)
    jd_text = normalize_text(jd_text)

    if not resume_text or not jd_text:
        return 0.0

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=5000
        )

        vectors = vectorizer.fit_transform([resume_text, jd_text])

        score = cosine_similarity(
            vectors[0:1],
            vectors[1:2]
        )[0][0]

        return round(float(score) * 100, 2)

    except (ImportError, ValueError):
        return 0.0


def compare_resume_to_jd(resume_data, jd_data) -> dict:
    """
    Compare a resume with a job description.

    Both arguments can be raw text or dictionaries returned by
    parse_resume() and parse_job_description().
    """

    resume_text = _get_text(resume_data)
    jd_text = _get_text(jd_data)

    resume_skills = _get_skills(resume_data)

    jd_skills = _get_skills(jd_data)

    if isinstance(jd_data, dict):
        required_skills = extract_skills_from_list(
            jd_data.get("required_skills", jd_skills)
        )

        preferred_skills = extract_skills_from_list(
            jd_data.get("preferred_skills", [])
        )
    else:
        required_skills = jd_skills
        preferred_skills = []

    if not required_skills and not preferred_skills:
        return {
            "success": False,
            "message": "No recognizable skills found in the job description.",
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": []
        }

    skill_result = calculate_skill_match(
        resume_skills,
        required_skills,
        preferred_skills
    )

    text_score = calculate_text_similarity(
        resume_text,
        jd_text
    )

    # Required skills carry the most weight.
    # Preferred skills add value, while text similarity contributes
    # a smaller amount to the final score.
    if preferred_skills:
        final_score = (
            skill_result["required_score"] * 0.70
            + skill_result["preferred_score"] * 0.20
            + text_score * 0.10
        )
    else:
        final_score = (
            skill_result["required_score"] * 0.85
            + text_score * 0.15
        )

    matched_skills = sorted(
        set(skill_result["matched_required_skills"])
        | set(skill_result["matched_preferred_skills"])
    )

    missing_skills = sorted(
        set(skill_result["missing_required_skills"])
        | set(skill_result["missing_preferred_skills"])
    )

    return {
        "success": True,
        "match_score": round(final_score, 2),
        "required_skill_score": skill_result["required_score"],
        "preferred_skill_score": skill_result["preferred_score"],
        "text_similarity_score": text_score,
        "resume_skills": resume_skills,
        "job_skills": sorted(set(required_skills) | set(preferred_skills)),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_required_skills": skill_result["matched_required_skills"],
        "missing_required_skills": skill_result["missing_required_skills"],
        "matched_preferred_skills": skill_result["matched_preferred_skills"],
        "missing_preferred_skills": skill_result["missing_preferred_skills"]
    }


def calculate_similarity(resume_data, jd_data) -> dict:
    """Compatibility alias for compare_resume_to_jd()."""
    return compare_resume_to_jd(resume_data, jd_data)

"""
PlaceMate AI - Career Recommendation Engine

Responsibilities:
1. Recommend suitable career paths based on student skills.
2. Compare student profiles with career requirements.
3. Calculate career match scores.
4. Identify missing skills.
5. Suggest skills to learn.
6. Rank career recommendations.

Dependencies:
    pip install scikit-learn
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# --------------------------------------------------
# CAREER DATABASE
# --------------------------------------------------

CAREER_PATHS = {
    "Data Analyst": {
        "description": (
            "Analyze datasets, create dashboards, identify trends, "
            "generate business insights and support decision-making."
        ),
        "skills": [
            "python", "sql", "excel", "power bi",
            "tableau", "statistics", "pandas",
            "data visualization", "data analysis"
        ],
        "interests": [
            "data", "analytics", "business",
            "visualization", "statistics", "reporting"
        ],
        "tools": ["python", "sql", "excel", "power bi", "tableau"]
    },

    "Data Scientist": {
        "description": (
            "Use statistics, programming and machine learning "
            "to build predictive models and discover patterns."
        ),
        "skills": [
            "python", "sql", "statistics", "machine learning",
            "pandas", "numpy", "scikit-learn",
            "deep learning", "data visualization"
        ],
        "interests": [
            "machine learning", "artificial intelligence",
            "statistics", "research", "data"
        ],
        "tools": ["python", "jupyter", "scikit-learn", "pandas"]
    },

    "Business Analyst": {
        "description": (
            "Understand business requirements, analyze processes, "
            "interpret data and communicate recommendations."
        ),
        "skills": [
            "excel", "sql", "power bi", "communication",
            "problem solving", "business analysis",
            "requirements gathering", "documentation",
            "data analysis"
        ],
        "interests": [
            "business", "management", "analytics",
            "strategy", "problem solving"
        ],
        "tools": ["excel", "sql", "power bi", "jira"]
    },

    "Machine Learning Engineer": {
        "description": (
            "Develop, train, evaluate and deploy machine learning "
            "models and intelligent applications."
        ),
        "skills": [
            "python", "machine learning", "deep learning",
            "scikit-learn", "tensorflow", "pytorch",
            "data structures", "algorithms", "statistics",
            "model deployment"
        ],
        "interests": [
            "artificial intelligence", "machine learning",
            "automation", "research", "programming"
        ],
        "tools": ["python", "tensorflow", "pytorch", "docker"]
    },

    "Software Developer": {
        "description": (
            "Design, develop, test and maintain software "
            "applications using programming languages and frameworks."
        ),
        "skills": [
            "java", "python", "javascript", "data structures",
            "algorithms", "object oriented programming",
            "git", "debugging", "problem solving",
            "database management"
        ],
        "interests": [
            "programming", "software development",
            "technology", "application development"
        ],
        "tools": ["java", "python", "git", "javascript"]
    },

    "Frontend Developer": {
        "description": (
            "Build responsive and interactive user interfaces "
            "for web applications."
        ),
        "skills": [
            "html", "css", "javascript", "react",
            "bootstrap", "responsive design", "git",
            "ui design", "api integration"
        ],
        "interests": [
            "web development", "design",
            "frontend", "user experience"
        ],
        "tools": ["html", "css", "javascript", "react"]
    },

    "Cybersecurity Analyst": {
        "description": (
            "Monitor systems, identify vulnerabilities, "
            "investigate security incidents and protect networks."
        ),
        "skills": [
            "networking", "linux", "python",
            "cybersecurity", "ethical hacking",
            "vulnerability assessment", "security tools",
            "risk assessment"
        ],
        "interests": [
            "cybersecurity", "security",
            "ethical hacking", "investigation"
        ],
        "tools": ["linux", "wireshark", "nmap", "python"]
    },

    "Product Analyst": {
        "description": (
            "Analyze product usage, user behavior, engagement "
            "and business metrics to improve product decisions."
        ),
        "skills": [
            "sql", "excel", "python", "statistics",
            "power bi", "data visualization",
            "product analytics", "communication",
            "problem solving", "a/b testing"
        ],
        "interests": [
            "product management", "analytics",
            "business", "user behavior", "strategy"
        ],
        "tools": ["sql", "excel", "power bi", "python"]
    }
}


# --------------------------------------------------
# INPUT NORMALIZATION
# --------------------------------------------------

def normalize_list(values):
    """
    Convert a list of skills/interests into normalized strings.
    """
    if not values:
        return []

    if isinstance(values, str):
        values = values.split(",")

    return list({
        str(value).strip().lower()
        for value in values
        if str(value).strip()
    })


def get_profile_text(skills, interests, education="", experience="", projects=""):
    """
    Convert student profile information into searchable text.
    """
    parts = [
        " ".join(skills),
        " ".join(interests),
        str(education or ""),
        str(experience or ""),
        str(projects or "")
    ]

    return " ".join(parts).lower()


# --------------------------------------------------
# CAREER MATCHING ENGINE
# --------------------------------------------------

def calculate_career_score(student_skills, student_interests, career):
    """
    Calculate a career match score.

    Weights:
        60% - Skill match
        30% - Interest match
        10% - TF-IDF text similarity
    """

    required_skills = set(career["skills"])
    required_interests = set(career["interests"])

    student_skills = set(student_skills)
    student_interests = set(student_interests)

    # Skill matching
    matched_skills = student_skills.intersection(required_skills)

    skill_score = (
        len(matched_skills) / len(required_skills) * 100
        if required_skills else 0
    )

    # Interest matching
    matched_interests = student_interests.intersection(
        required_interests
    )

    interest_score = (
        len(matched_interests) / len(required_interests) * 100
        if required_interests else 0
    )

    # TF-IDF similarity
    student_text = " ".join(
        list(student_skills) + list(student_interests)
    )

    career_text = (
        career["description"] + " " +
        " ".join(career["skills"]) + " " +
        " ".join(career["interests"])
    )

    if student_text.strip():
        vectorizer = TfidfVectorizer()
        vectors = vectorizer.fit_transform([
            student_text,
            career_text
        ])

        similarity_score = (
            cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
            * 100
        )
    else:
        similarity_score = 0

    final_score = (
        skill_score * 0.60 +
        interest_score * 0.30 +
        similarity_score * 0.10
    )

    return {
        "match_score": round(min(final_score, 100), 2),
        "skill_score": round(skill_score, 2),
        "interest_score": round(interest_score, 2),
        "similarity_score": round(similarity_score, 2),
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(required_skills - student_skills),
        "matched_interests": sorted(matched_interests)
    }


# --------------------------------------------------
# RECOMMEND CAREERS
# --------------------------------------------------

def recommend_careers(
    skills,
    interests=None,
    education="",
    experience="",
    projects="",
    top_n=5
):
    """
    Generate ranked career recommendations for a student.

    Parameters:
        skills: List of student's skills.
        interests: List of student's interests.
        education: Educational background.
        experience: Internship/work experience.
        projects: Project descriptions.
        top_n: Number of recommendations.

    Returns:
        List of ranked career recommendations.
    """

    student_skills = normalize_list(skills)
    student_interests = normalize_list(interests)

    if not student_skills and not student_interests:
        return []

    recommendations = []

    for career_name, career_data in CAREER_PATHS.items():

        result = calculate_career_score(
            student_skills,
            student_interests,
            career_data
        )

        recommendations.append({
            "career": career_name,
            "description": career_data["description"],
            "match_score": result["match_score"],
            "skill_score": result["skill_score"],
            "interest_score": result["interest_score"],
            "similarity_score": result["similarity_score"],
            "matched_skills": result["matched_skills"],
            "missing_skills": result["missing_skills"],
            "matched_interests": result["matched_interests"],
            "recommended_tools": career_data["tools"]
        })

    recommendations.sort(
        key=lambda item: item["match_score"],
        reverse=True
    )

    return recommendations[:max(1, min(int(top_n), len(recommendations)))]


# --------------------------------------------------
# SKILL GAP ANALYSIS
# --------------------------------------------------

def analyze_skill_gap(skills, career_name):
    """
    Identify the skills a student needs to develop
    for a selected career.
    """

    student_skills = set(normalize_list(skills))

    career = CAREER_PATHS.get(career_name)

    if not career:
        return {
            "success": False,
            "message": f"Career '{career_name}' not found.",
            "available_careers": list(CAREER_PATHS.keys())
        }

    required_skills = set(career["skills"])

    matched = sorted(student_skills.intersection(required_skills))
    missing = sorted(required_skills - student_skills)

    completion = (
        len(matched) / len(required_skills) * 100
        if required_skills else 0
    )

    return {
        "success": True,
        "career": career_name,
        "required_skills": sorted(required_skills),
        "matched_skills": matched,
        "missing_skills": missing,
        "completion_percentage": round(completion, 2),
        "learning_recommendations": missing[:5]
    }


# --------------------------------------------------
# AVAILABLE CAREERS
# --------------------------------------------------

def get_available_careers():
    """
    Return all career paths available in the system.
    """

    return [
        {
            "career": career_name,
            "description": career_data["description"],
            "required_skills": career_data["skills"],
            "interests": career_data["interests"],
            "tools": career_data["tools"]
        }
        for career_name, career_data in CAREER_PATHS.items()
    ]

from app.ai.skill_extractor import (
    extract_skills,
    extract_skills_from_list,
    normalize_text
)


CAREER_SKILLS = {
    "Data Analyst": {
        "required": [
            "python",
            "sql",
            "excel",
            "statistics",
            "data analysis",
            "data visualization",
            "pandas",
            "power bi"
        ],
        "optional": [
            "tableau",
            "numpy",
            "communication"
        ]
    },

    "Business Analyst": {
        "required": [
            "excel",
            "sql",
            "business analysis",
            "requirements gathering",
            "documentation",
            "communication",
            "problem solving"
        ],
        "optional": [
            "power bi",
            "jira",
            "agile"
        ]
    },

    "Data Scientist": {
        "required": [
            "python",
            "sql",
            "statistics",
            "machine learning",
            "pandas",
            "numpy",
            "scikit-learn"
        ],
        "optional": [
            "deep learning",
            "tensorflow",
            "pytorch",
            "data visualization"
        ]
    },

    "Machine Learning Engineer": {
        "required": [
            "python",
            "machine learning",
            "deep learning",
            "scikit-learn",
            "tensorflow",
            "pytorch",
            "numpy"
        ],
        "optional": [
            "docker",
            "aws",
            "git",
            "rest api"
        ]
    },
        "AI/ML Engineer": {
        "required": [
            "python",
            "statistics",
            "machine learning",
            "deep learning",
            "data preprocessing",
            "scikit-learn",
            "model evaluation"
        ],
        "optional": [
            "tensorflow",
            "pytorch",
            "numpy",
            "docker",
            "rest api"
        ]
    },


    "Software Developer": {
        "required": [
            "java",
            "python",
            "data structures",
            "algorithms",
            "object oriented programming",
            "sql",
            "git"
        ],
        "optional": [
            "rest api",
            "react",
            "node.js",
            "dbms"
        ]
    },

    "QA / Test Engineer": {
        "required": [
            "testing",
            "manual testing",
            "automation testing",
            "selenium",
            "python",
            "java",
            "sql"
        ],
        "optional": [
            "pytest",
            "jira",
            "agile",
            "git"
        ]
    },

    "Cybersecurity Analyst": {
        "required": [
            "cybersecurity",
            "networking",
            "linux",
            "ethical hacking",
            "vulnerability assessment",
            "risk assessment"
        ],
        "optional": [
            "penetration testing",
            "python",
            "security tools"
        ]
    },

    "Cloud Engineer": {
        "required": [
            "aws",
            "azure",
            "linux",
            "docker",
            "kubernetes",
            "networking"
        ],
        "optional": [
            "ci/cd",
            "python",
            "google cloud",
            "git"
        ]
    },

    "Product Analyst": {
        "required": [
            "sql",
            "excel",
            "data analysis",
            "data visualization",
            "statistics",
            "product analytics"
        ],
        "optional": [
            "a/b testing",
            "power bi",
            "communication",
            "problem solving"
        ]
    }
}


LEARNING_RESOURCES = {
    "python": "Practice Python fundamentals, functions, and data handling.",
    "sql": "Practice SELECT, JOIN, GROUP BY, subqueries, and window functions.",
    "excel": "Learn formulas, lookup functions, pivot tables, and data cleaning.",
    "statistics": "Study descriptive statistics, probability, and hypothesis testing.",
    "data analysis": "Practice cleaning, exploring, and interpreting real datasets.",
    "data visualization": "Build dashboards and learn how to communicate insights.",
    "pandas": "Practice DataFrames, filtering, grouping, and data transformation.",
    "power bi": "Learn Power Query, data modelling, DAX, and dashboard creation.",
    "tableau": "Build interactive dashboards using Tableau.",
    "numpy": "Practice arrays, indexing, and numerical operations.",
    "scikit-learn": "Learn preprocessing, model training, and evaluation.",
    "machine learning": "Study regression, classification, clustering, and evaluation.",
    "communication": "Practice explaining technical findings clearly.",
    "problem solving": "Practice structured problem-solving and case-based exercises.",
    "deep learning": "Study neural networks and their training process.",
    "tensorflow": "Build and train basic neural network models.",
    "pytorch": "Practice building neural networks with PyTorch.",
    "business analysis": "Learn business process analysis and stakeholder needs.",
    "requirements gathering": "Practice documenting functional and non-functional requirements.",
    "documentation": "Write clear technical and business documentation.",
    "a/b testing": "Study experiment design, control groups, and statistical significance.",
    "product analytics": "Learn funnels, retention, conversion, and product metrics.",
    "java": "Practice Java fundamentals, OOP, and collections.",
    "data structures": "Practice arrays, strings, linked lists, stacks, queues, and trees.",
    "algorithms": "Study searching, sorting, recursion, and complexity analysis.",
    "object oriented programming": "Practice classes, objects, inheritance, and polymorphism.",
    "git": "Learn commits, branches, merges, and pull requests.",
    "testing": "Learn test cases, test scenarios, and defect reporting.",
    "manual testing": "Practice writing and executing manual test cases.",
    "automation testing": "Learn automation frameworks and test scripts.",
    "selenium": "Build browser automation tests using Selenium.",
    "linux": "Practice Linux commands, permissions, and shell basics.",
    "networking": "Study TCP/IP, DNS, HTTP, ports, and network fundamentals.",
    "cybersecurity": "Learn security fundamentals, common threats, and defensive practices.",
    "ethical hacking": "Study authorized security testing in legal lab environments.",
    "vulnerability assessment": "Learn how to identify, assess, and document vulnerabilities.",
    "risk assessment": "Practice identifying risks and evaluating their impact.",
    "aws": "Learn core AWS services and cloud fundamentals.",
    "azure": "Learn Azure fundamentals and cloud services.",
    "docker": "Learn containers, images, and Dockerfiles.",
    "kubernetes": "Study pods, deployments, services, and cluster basics.",
    "rest api": "Learn HTTP methods, status codes, and REST API design.",
    "react": "Build React components and practice state and props.",
    "node.js": "Build backend APIs using Node.js.",
    "postgresql": "Practice relational database design and PostgreSQL queries."
}


def _get_student_skills(student_skills) -> list[str]:
    """Accept a list, comma-separated string, or student profile dictionary."""

    if isinstance(student_skills, dict):
        skills = student_skills.get("skills", [])

        if not skills:
            skills = student_skills.get("technical_skills", [])

        if isinstance(skills, str):
            return extract_skills(skills)

        return extract_skills_from_list(skills)

    if isinstance(student_skills, str):
        return extract_skills(student_skills)

    return extract_skills_from_list(student_skills)


def analyze_skill_gap(student_skills, career: str) -> dict:
    """
    Analyze a student's skills against a selected career.

    Example:
        analyze_skill_gap(
            ["Python", "SQL", "Excel"],
            "Data Analyst"
        )
    """

    if not career:
        return {
            "success": False,
            "message": "Please provide a career name."
        }

    normalized_career = normalize_text(career)

    career_name = next(
        (
            name for name in CAREER_SKILLS
            if normalize_text(name) == normalized_career
        ),
        None
    )

    if career_name is None:
        return {
            "success": False,
            "message": "Career not found.",
            "available_careers": list(CAREER_SKILLS.keys())
        }

    student_set = set(_get_student_skills(student_skills))

    required_skills = CAREER_SKILLS[career_name]["required"]
    optional_skills = CAREER_SKILLS[career_name]["optional"]

    required_set = set(required_skills)
    optional_set = set(optional_skills)

    matched_required = sorted(student_set & required_set)
    missing_required = sorted(required_set - student_set)

    matched_optional = sorted(student_set & optional_set)
    missing_optional = sorted(optional_set - student_set)

    completion = (
        len(matched_required) / len(required_set) * 100
        if required_set else 0
    )

    learning_recommendations = [
        skill for skill in missing_required
    ]

    return {
        "success": True,
        "career": career_name,
        "required_skills": sorted(required_set),
        "matched_skills": matched_required,
        "missing_skills": missing_required,
        "optional_skills": sorted(optional_set),
        "matched_optional_skills": matched_optional,
        "missing_optional_skills": missing_optional,
        "completion_percentage": round(completion, 2),
        "learning_recommendations": learning_recommendations,
        "learning_details": {
            skill: LEARNING_RESOURCES.get(
                skill,
                f"Study {skill} and complete a practical project."
            )
            for skill in learning_recommendations
        }
    }


def get_available_careers() -> list[str]:
    """Return the career paths supported by the analyzer."""
    return list(CAREER_SKILLS.keys())
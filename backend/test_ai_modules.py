from app.ai.skill_extractor import extract_skills
from app.ai.jd_parser import parse_job_description
from app.ai.similarity_engine import compare_resume_to_jd
from app.ai.skill_gap_analyzer import (
    analyze_skill_gap,
    get_available_careers
)


# Sample student resume
resume_text = """
Final year Computer Science student.

Technical Skills:
Python, SQL, Excel, Power BI, Pandas, NumPy.

Projects:
Sales Data Analysis using Python and Power BI.
"""

# Sample job description
jd_text = """
Data Analyst Intern

Requirements:
Python, SQL, Excel, Power BI, Statistics,
Pandas and Data Visualization.

Responsibilities:
Analyze datasets, prepare reports,
build dashboards and communicate insights.

Preferred Skills:
Tableau and Machine Learning.
"""


print("\n========== SKILL EXTRACTION ==========")
print(extract_skills(resume_text))


print("\n========== JOB DESCRIPTION PARSING ==========")
parsed_jd = parse_job_description(jd_text)
print(parsed_jd)


print("\n========== RESUME VS JD MATCHING ==========")
result = compare_resume_to_jd(
    resume_text,
    parsed_jd
)

print("Match Score:", result["match_score"])
print("Matched Skills:", result["matched_skills"])
print("Missing Skills:", result["missing_skills"])


print("\n========== SKILL GAP ANALYSIS ==========")
gap = analyze_skill_gap(
    ["Python", "SQL", "Excel", "Power BI", "Pandas"],
    "Data Analyst"
)

print(gap)


print("\n========== AVAILABLE CAREERS ==========")
print(get_available_careers())
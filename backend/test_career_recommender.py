
from app.ai.career_recommender import (
    recommend_careers,
    analyze_skill_gap,
    get_available_careers
)

student_skills = [
    "Python",
    "SQL",
    "Excel",
    "Power BI",
    "Pandas",
    "Data Visualization"
]

student_interests = [
    "Data",
    "Analytics",
    "Business",
    "Statistics"
]

print("\n========== CAREER RECOMMENDATIONS ==========")

recommendations = recommend_careers(
    skills=student_skills,
    interests=student_interests,
    top_n=5
)

for index, recommendation in enumerate(recommendations, start=1):
    print(f"\n{index}. {recommendation['career']}")
    print(f"Match Score: {recommendation['match_score']}%")
    print(f"Matched Skills: {recommendation['matched_skills']}")
    print(f"Missing Skills: {recommendation['missing_skills']}")

print("\n========== SKILL GAP ANALYSIS ==========")

gap = analyze_skill_gap(
    skills=student_skills,
    career_name="Data Analyst"
)

print(gap)

print("\n========== AVAILABLE CAREERS ==========")

print(len(get_available_careers()), "career paths available")

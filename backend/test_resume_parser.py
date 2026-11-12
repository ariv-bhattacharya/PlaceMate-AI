from app.ai.resume_parser import parse_resume

resume_path = r"C:\Users\KIIT\PlaceMate\backend\uploads\resumes\ishita.pdf"

try:
    result = parse_resume(resume_path)

    print("\n========== RESUME PARSING ==========")
    print("Success:", result["success"])
    print("File:", result["file_name"])
    print("File Type:", result["file_type"])
    print("Word Count:", result["word_count"])

    print("\n========== EXTRACTED SKILLS ==========")
    print(result["skills"])

    print("\n========== RESUME SECTIONS ==========")
    for section, content in result["sections"].items():
        print(f"\n{section.upper()}:")
        print(content[:500])

except Exception as error:
    print("RESUME PARSING ERROR:", error)
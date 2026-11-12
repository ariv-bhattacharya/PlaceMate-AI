import os
import re
from pathlib import Path

from app.ai.skill_extractor import extract_skills


SECTION_PATTERNS = {
    "summary": [
        "summary",
        "professional summary",
        "profile",
        "career objective",
        "objective"
    ],
    "education": [
        "education",
        "academic background",
        "academic qualifications"
    ],
    "experience": [
        "experience",
        "work experience",
        "professional experience",
        "internship",
        "internships"
    ],
    "projects": [
        "projects",
        "academic projects",
        "personal projects"
    ],
    "skills": [
        "skills",
        "technical skills",
        "key skills",
        "core competencies"
    ],
    "certifications": [
        "certifications",
        "certificates",
        "courses",
        "training"
    ],
    "achievements": [
        "achievements",
        "accomplishments",
        "awards"
    ]
}


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF using PyMuPDF, with pdfplumber as fallback."""

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Resume file not found: {file_path}")

    text = ""

    try:
        import fitz

        document = fitz.open(file_path)

        for page in document:
            text += page.get_text("text") + "\n"

        document.close()

    except Exception:
        text = ""

    if not text.strip():
        try:
            import pdfplumber

            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += (page.extract_text() or "") + "\n"

        except Exception as error:
            raise ValueError(
                f"Unable to read PDF resume: {error}"
            ) from error

    if not text.strip():
        raise ValueError(
            "No readable text found. The PDF may be scanned or image-based."
        )

    return clean_text(text)


def extract_text_from_txt(file_path: str) -> str:
    """Read a plain text resume."""

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Resume file not found: {file_path}")

    with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
        return clean_text(file.read())


def clean_text(text: str) -> str:
    """Clean extracted resume text without removing useful information."""

    text = text.replace("\x00", " ")
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def extract_sections(text: str) -> dict:
    """Identify common resume sections using their headings."""

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    sections = {name: "" for name in SECTION_PATTERNS}

    heading_lookup = {}

    for section_name, headings in SECTION_PATTERNS.items():
        for heading in headings:
            heading_lookup[heading.lower()] = section_name

    current_section = None
    section_content = {name: [] for name in SECTION_PATTERNS}

    for line in lines:
        normalized_line = re.sub(r"[:\-\s]+$", "", line.lower()).strip()

        if normalized_line in heading_lookup:
            current_section = heading_lookup[normalized_line]
            continue

        if current_section:
            section_content[current_section].append(line)

    for section_name, content in section_content.items():
        sections[section_name] = "\n".join(content).strip()

    return sections


def parse_resume(file_path: str) -> dict:
    """
    Parse a PDF or TXT resume.

    Returns:
        {
            success,
            file_name,
            file_type,
            text,
            sections,
            skills,
            word_count
        }
    """

    extension = Path(file_path).suffix.lower()

    if extension == ".pdf":
        text = extract_text_from_pdf(file_path)

    elif extension == ".txt":
        text = extract_text_from_txt(file_path)

    else:
        raise ValueError(
            "Unsupported resume format. Please upload a PDF or TXT file."
        )

    sections = extract_sections(text)
    skills = extract_skills(text)

    return {
        "success": True,
        "file_name": os.path.basename(file_path),
        "file_type": extension.replace(".", ""),
        "text": text,
        "sections": sections,
        "skills": skills,
        "word_count": len(text.split())
    }


# Convenient alias for existing services.
def parse_resume_file(file_path: str) -> dict:
    return parse_resume(file_path)
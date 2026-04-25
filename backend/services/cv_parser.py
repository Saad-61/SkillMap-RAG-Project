from pathlib import Path

import docx
import fitz


def extract_text_from_file(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        with fitz.open(path) as pdf:
            return "\n".join(page.get_text("text") for page in pdf).strip()

    if suffix == ".docx":
        document = docx.Document(str(path))
        return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()

    # Fallback for txt/other plain-text files.
    return path.read_text(encoding="utf-8", errors="ignore").strip()


def parse_cv(file_path: str):
    text = extract_text_from_file(file_path)
    return {"details": text[:1000]}

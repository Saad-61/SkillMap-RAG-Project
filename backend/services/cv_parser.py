from pathlib import Path

import docx
import fitz
from utils.link_extractor import extract_links as _extract_links


def extract_links(text: str):
    return _extract_links(text)


def extract_links_from_file(file_path: str, text: str | None = None):
    path = Path(file_path)
    suffix = path.suffix.lower()

    links = []

    if suffix == ".pdf":
        with fitz.open(path) as pdf:
            for page in pdf:
                for link in page.get_links():
                    uri = link.get("uri")
                    if uri:
                        links.append(uri)

    if text is None:
        text = extract_text_from_file(file_path)

    links.extend(extract_links(text))

    # Preserve order while removing duplicates.
    return list(dict.fromkeys(links))


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

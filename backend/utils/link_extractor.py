import re


def extract_links(text: str):
    # Match full URLs and partial domain forms for GitHub/LinkedIn.
    urls = re.findall(r"https?://\S+", text, flags=re.IGNORECASE)
    github = re.findall(r"(?:https?://)?(?:www\.)?github\.com/\S+", text, flags=re.IGNORECASE)
    linkedin = re.findall(r"(?:https?://)?(?:www\.)?linkedin\.com/\S+", text, flags=re.IGNORECASE)

    combined = urls + github + linkedin
    cleaned = [link.rstrip('.,);:"\'\\]') for link in combined]

    # Preserve order while removing duplicates.
    return list(dict.fromkeys(cleaned))

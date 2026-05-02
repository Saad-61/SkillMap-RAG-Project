import re


def _canonicalize_link(link: str) -> str:
    normalized = link.strip().rstrip('.,);:"\'\\]')
    if normalized.startswith("www."):
        normalized = f"https://{normalized}"
    if re.match(r"^(?:github|linkedin|gitlab|bitbucket)\.com/", normalized, flags=re.IGNORECASE):
        normalized = f"https://{normalized}"
    return normalized


def extract_links(text: str):
    # Match common CV links, including bare GitHub/LinkedIn URLs and mailto links.
    patterns = [
        r'https?://[^\s<>"\']+',
        r'www\.[^\s<>"\']+',
        r'mailto:[^\s<>"\']+',
        r'(?:github|linkedin|gitlab|bitbucket)\.com/[^\s<>"\']+',
    ]

    combined = []
    for pattern in patterns:
        combined.extend(re.findall(pattern, text, flags=re.IGNORECASE))

    cleaned = [_canonicalize_link(link) for link in combined if link]

    # Preserve order while removing duplicates.
    return list(dict.fromkeys(cleaned))

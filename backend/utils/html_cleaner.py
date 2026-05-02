import re
from html import unescape


def strip_html(text: str) -> str:
    """
    Remove HTML tags and entities from text.
    Converts HTML to plain text with proper formatting.
    """
    if not text:
        return ""
    
    # Decode HTML entities (&amp; -> &, etc.)
    text = unescape(text)
    
    # Replace common block-level elements with newlines
    text = re.sub(r'<p[^>]*>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</p>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<div[^>]*>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</div>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<li[^>]*>', '\n• ', text, flags=re.IGNORECASE)
    text = re.sub(r'</li>', '', text, flags=re.IGNORECASE)
    text = re.sub(r'<ul[^>]*>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</ul>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<ol[^>]*>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</ol>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<h[1-6][^>]*>', '\n### ', text, flags=re.IGNORECASE)
    text = re.sub(r'</h[1-6]>', '\n', text, flags=re.IGNORECASE)
    
    # Remove all remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean up whitespace
    text = re.sub(r'\n\s*\n', '\n', text)  # Remove multiple blank lines
    text = re.sub(r' +', ' ', text)  # Remove multiple spaces
    text = text.strip()
    
    return text


def clean_job_description(job: dict) -> dict:
    """
    Clean HTML from job description and title.
    Returns a new dict with cleaned fields.
    """
    cleaned_job = job.copy()
    
    if "description" in cleaned_job:
        cleaned_job["description"] = strip_html(cleaned_job["description"])
    
    if "title" in cleaned_job:
        cleaned_job["title"] = strip_html(cleaned_job["title"])

    if "url" in cleaned_job:
        cleaned_job["url"] = str(cleaned_job["url"] or "").strip()

    if "company_name" in cleaned_job:
        cleaned_job["company_name"] = strip_html(str(cleaned_job["company_name"] or "")).strip()
    
    return cleaned_job

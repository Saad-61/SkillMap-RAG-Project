import re
from ai.llm import generate_response


def _extract_section_snippet(cv_text: str, section: str, max_lines: int = 80) -> str:
    """
    Extract the most relevant section block from the CV.
    Falls back to a head snippet if the section is not found.
    """
    lines = cv_text.splitlines()
    section_name = section.strip().lower()

    start_index = None
    for index, line in enumerate(lines):
        cleaned = line.strip().lower()
        if not cleaned:
            continue
        if cleaned == section_name or cleaned.startswith(section_name + " ") or cleaned.startswith(section_name + ":"):
            start_index = index
            break

    if start_index is not None:
        block: list[str] = []
        for line in lines[start_index:]:
            stripped = line.strip()
            if block and stripped and stripped == stripped.upper() and len(stripped) <= 80:
                break
            if block and stripped.endswith(":") and len(stripped) <= 40:
                break
            block.append(line)
            if len(block) >= max_lines:
                break

        extracted = "\n".join(block).strip()
        if extracted:
            return extracted

    # Fall back: return first 400 chars of CV as minimal context
    return cv_text[:800].strip() + ("..." if len(cv_text) > 800 else "")


def generate_fix_rewrite(
    cv_text: str,
    section: str,
    fix: str,
    why: str,
    how: str,
    output_format: str,
):
    format_name = "LaTeX-ready snippet" if output_format == "latex" else "plain text"

    # Provide the full CV plus a focused section block so the model can preserve names
    # while still keeping the rewrite targeted to the requested section.
    full_cv_text = cv_text.strip()
    section_snippet = _extract_section_snippet(cv_text, section)

    prompt = f"""
You are an expert resume editor.

Rewrite only the requested CV section. Do not rewrite the whole CV.

FULL CV TEXT:
{full_cv_text}

RELEVANT CV SECTION ({section}):
{section_snippet}

TARGET SECTION:
{section}

REQUESTED CHANGE:
{fix}

WHY:
{why}

HOW:
{how}

OUTPUT MODE:
{format_name}

RULES:
- Focus only on the named section.
- Preserve exact names of courses, certifications, projects, tools, employers, and titles that already appear in the CV.
- Keep the user's likely background grounded in the CV section text above.
- Do not invent jobs, projects, metrics, awards, links, or technologies.
- Do not replace a specific certification or course title with a generic placeholder.
- Do not append any note about the input being incomplete; if a bullet is unfinished, rewrite only the supported part cleanly.
- If information is missing, improve phrasing and structure using only supported details.
- Return replacement-ready content the user can paste directly into their CV.
- If output mode is plain text, return clean resume-ready text only.
- If output mode is latex, return a LaTeX-friendly snippet only, with escaped special characters.
- Do not include markdown fences.
- Add a short paste note explaining where to place the rewrite.

RETURN STRICT JSON:
{{
  "section": "{section}",
  "format": "{output_format}",
  "rewritten_text": "",
  "notes": ""
}}
"""

    try:
        result = generate_response(prompt, request_source="rewrite")
        if not isinstance(result, dict):
            return {"error": "Rewrite generation returned an invalid response."}
        return result
    except Exception as e:
        print(f"[Rewrite] Exception during rewrite generation: {e}")
        return {
            "error": f"Rewrite generation failed: {str(e)}",
            "section": section,
            "format": output_format,
            "rewritten_text": "",
            "notes": ""
        }

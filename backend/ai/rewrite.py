from ai.llm import generate_response


def generate_fix_rewrite(
    cv_text: str,
    section: str,
    fix: str,
    why: str,
    how: str,
    output_format: str,
):
    format_name = "LaTeX-ready snippet" if output_format == "latex" else "plain text"

    prompt = f"""
You are an expert resume editor.

Rewrite only the requested CV section. Do not rewrite the whole CV.

CV TEXT:
{cv_text}

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
- Keep the user's likely background and evidence grounded in the CV text.
- Do not invent jobs, projects, metrics, awards, links, or technologies.
- If information is missing, improve phrasing and structure using only supported details.
- Return replacement-ready content the user can paste directly into their CV.
- If output mode is plain text, return clean resume-ready text only.
- If output mode is latex, return a LaTeX-friendly snippet only, with escaped special characters where needed.
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

    result = generate_response(prompt)
    if not isinstance(result, dict):
        return {"error": "Rewrite generation returned an invalid response."}
    return result

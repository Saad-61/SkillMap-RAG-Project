from ai.llm import generate_response
from utils.analysis_postprocess import postprocess_analysis


def analyze_cv(cv_text, jobs, links=None):
    links = links or []
    job_context = ""

    for job in jobs:
        job_context += f"""
Title: {job['title']}
Description: {job['description']}
Score: {job.get('score', 'N/A')}
"""

    prompt = """
You are an AI career assistant.

Analyze the given CV against the job descriptions.

----------------------------------------
CV:
__CV_TEXT__

----------------------------------------
JOBS:
__JOB_CONTEXT__

----------------------------------------
LINKS FOUND IN CV:
__LINKS__

----------------------------------------

TASKS:

1. JOB MATCHING
- Use the provided similarity scores as base
- Do NOT change them significantly
- Explain match in 1-2 lines max
- Mention the exact evidence from the CV and the exact gap from the job
- Do not use generic praise like "strong match" without specifics

2. MISSING SKILLS ANALYSIS

For each missing skill:
- Assign priority: HIGH / MEDIUM / LOW
- Priority based on:
  • Frequency in job descriptions
  • Importance for role
- Only include skills that are clearly supported by the matched jobs or clearly missing from the CV
- Do not add filler skills that are not relevant to the current match set
- Keep each missing skill entry actionable and tied to one concrete project or one concrete new project idea

IMPORTANT LOGIC:
- If skill can be applied to an existing project → suggest that project
- If NOT → suggest a NEW PROJECT
- Do NOT force a missing skill into an existing project if the fit is weak
- If no current project clearly demonstrates the skill, set project_type to "new"
- For foundational missing skills, prefer a small practical new project over a stretched existing-project suggestion

For NEW PROJECT:
- Keep it simple and practical
- Suitable for student level
- Aligned with job roles
- Make the project title specific, not generic
- The implementation must say WHAT to build, WHERE to build it, and HOW to implement it

3. PROJECT IMPROVEMENTS
- Suggest improvements ONLY for existing projects
- Focus on practical upgrades (not theory)
- Keep concise
- Every improvement MUST follow this structure:
  WHAT → WHERE → HOW
- Example:
  Add real-time match updates → ScoutVCT → use WebSockets in FastAPI
- Avoid vague advice like "improve UI" or "enhance features"
- Mention the exact project name in every improvement
- If you suggest a technology, name the feature and the concrete implementation path
- Aim for improvements that sound like real roadmap items, not resume filler
- Do not repeat the same idea in both improvement and impact fields
- Make impact measurable, concrete, or user-visible
- Keep improvement as the feature change and impact as the outcome

4. CV FIXES
- Give short, practical improvements
- If you mention a fix, make it specific. Example:
  Add dark mode → BookYourShoot dashboard → implement Tailwind dark variants and a theme toggle
- Tie each fix to a CV section or project
- Avoid generic advice like "make it better" or "quantify achievements" unless you say where and how
- If a fix is about links, say exactly which links and where to place them
- Do not repeat the same wording across multiple CV fixes
- Make each fix distinct: one on summary, one on skills, one on project proof if possible

5. TOP ACTIONS (VERY IMPORTANT)
- Return top 3 most important next steps
- Must be clear and actionable
- Each action should be something the user can do this week
- Include the project or section it affects
- Each action must include a concrete deliverable, not just an idea
- Example deliverables: add Dockerfile, add Swagger docs, rewrite summary, add live demo link
- Avoid repeating the same theme in more than one action

----------------------------------------

RULES:
- Keep explanations SHORT (1-2 lines max)
- Focus on beginner → intermediate improvements
- Avoid overly advanced topics unless necessary
- Stay aligned with job descriptions
- Be practical and actionable
- If GitHub or LinkedIn links are present in LINKS FOUND IN CV,
  DO NOT suggest adding GitHub or LinkedIn links.
- Do not add a career_path or future-role recommendation section.
- Keep the output grounded in the current CV and the matched jobs only.
- If the CV does not show evidence for a suggestion, do not invent it.
- Prefer specific project names, technologies, and measurable deliverables over abstract advice.
- Avoid repeating the same technology or project suggestion across multiple sections unless it adds a different angle.

----------------------------------------

OUTPUT FORMAT (STRICT JSON ONLY):

{
  "job_matches": [
    {
      "title": "",
      "score": 0,
      "reason": "",
      "evidence": "",
      "gap": ""
    }
  ],
  "missing_skills": [
    {
      "skill": "",
      "priority": "HIGH | MEDIUM | LOW",
      "why": "",
      "project_type": "existing | new",
      "project": "",
      "project_idea": "",
      "implementation": "",
      "evidence": ""
    }
  ],
  "project_improvements": [
    {
      "project": "",
      "current_issue": "",
      "improvement": "",
      "impact": ""
    }
  ],
  "cv_fixes": [
    {
      "section": "",
      "fix": "",
      "why": "",
      "how": ""
    }
  ],
  "top_actions": [
    {
      "action": "",
      "section": "",
      "why": "",
      "how": ""
    }
  ]
}
"""

    prompt = (
        prompt
        .replace("__CV_TEXT__", cv_text)
        .replace("__JOB_CONTEXT__", job_context)
        .replace("__LINKS__", "\n".join(links) if links else "None")
    )

    try:
        response = generate_response(prompt, request_source="analysis")
        return postprocess_analysis(response)
    except Exception as e:
        # If LLM generation fails for any reason, return error response
        error_response = {
            "error": f"Analysis failed: {str(e)}",
            "raw": "",
            "job_matches": [],
            "missing_skills": [],
            "project_improvements": [],
            "cv_fixes": [],
            "top_actions": []
        }
        print(f"[Analyzer] Exception during CV analysis: {e}")
        return error_response
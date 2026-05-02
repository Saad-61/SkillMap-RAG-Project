import hashlib
import json
from ai.llm import generate_response
from utils.analysis_postprocess import postprocess_analysis


# ---------------------------------------------------------------------------
# Fix E: In-memory cache — same CV + same jobs → zero LLM call
# ---------------------------------------------------------------------------
_analysis_cache: dict[str, dict] = {}


def _make_cache_key(cv_skills: list, top_jobs: list, links: list) -> str:
    """Stable MD5 key from the structured inputs (not raw CV text)."""
    payload = json.dumps(
        {"skills": sorted(cv_skills), "jobs": top_jobs, "links": sorted(links)},
        sort_keys=True,
    )
    return hashlib.md5(payload.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Fix F: Zero-overlap fast-path — no LLM needed
# ---------------------------------------------------------------------------
_ZERO_OVERLAP_TEMPLATE = {
    "job_matches": [],
    "missing_skills": [
        {
            "skill": "Skill alignment with target roles",
            "priority": "HIGH",
            "why": "No skill overlap was found between your CV and the matched jobs. Focus on building the core skills those roles require.",
            "project_type": "new",
            "project": "Starter Project",
            "project_idea": "Build a small project that uses at least 2-3 skills from the job descriptions.",
            "implementation": "Pick the most common skill in the job list, build a minimal working project around it, and push it to GitHub.",
            "evidence": "Zero skill overlap detected between CV and matched jobs.",
        }
    ],
    "project_improvements": [],
    "cv_fixes": [
        {
            "section": "Skills",
            "fix": "Add the technical skills required by your target roles.",
            "why": "Your skills section does not currently match the requirements of the retrieved jobs.",
            "how": "Review the job descriptions, identify the top 5 required skills, and add those you genuinely have.",
        }
    ],
    "top_actions": [
        {
            "action": "Research target job requirements and map your existing skills to them.",
            "section": "Skills",
            "why": "Zero overlap means recruiters will not shortlist this CV for these roles.",
            "how": "Pick 2-3 job postings, list their required skills, highlight gaps, and plan one small project per gap.",
        }
    ],
    "_source": "template:zero_overlap",
}


# ---------------------------------------------------------------------------
# Fix A+B: Build compact structured prompt — no raw CV text, no full JDs
# ---------------------------------------------------------------------------
def _build_structured_prompt(
    cv_skills: list,
    top_jobs: list,
    full_cv_text: str,
    project_context: str,
    links: list,
) -> str:
    """
    Sends structured data to the LLM plus a focused excerpt of the CV for projects.
    Eliminates full job description text from the prompt to save tokens.
    """
    jobs_block = json.dumps(top_jobs, indent=2)

    has_github = any("github" in l.lower() for l in links)
    has_linkedin = any("linkedin" in l.lower() for l in links)
    link_note = ""
    if has_github:
        link_note += " GitHub link is present in CV — do NOT suggest adding GitHub.\n"
    if has_linkedin:
        link_note += " LinkedIn link is present in CV — do NOT suggest adding LinkedIn.\n"

    return f"""
You are an AI career assistant. All matching, scoring, and skill extraction has already been done by code.
Your job is ONLY to write the explanations, reasons, gaps, and actionable advice.

Do NOT re-score jobs. Do NOT change the scores. Use them as-is.

---
CANDIDATE SUMMARY:
- skills: {json.dumps(cv_skills)}
- links: {json.dumps(links)}

---
CANDIDATE FULL CV DETAILS:
{full_cv_text}

---
CANDIDATE PROJECT/EXPERIENCE EXCERPT:
{project_context}

---
TOP MATCHED JOBS (pre-scored by code):
{jobs_block}

---
LINK NOTES:
{link_note if link_note else 'No GitHub/LinkedIn links found — you may suggest adding them.'}

---
TASKS:

1. JOB MATCHING — for each job in top_jobs:
   - Use the provided score as-is
    - Write reason in 2 concise sentences: mention the specific CV projects, tools, or experience that support this role
    - Write evidence: cite matched_skills and, if relevant, one project or section name
    - Write gap: state the exact requirements the CV does not yet show, using the job's wording where possible

2. MISSING SKILLS — look at missing_skills across all jobs:
   - Pick top 5 unique skills, ordered HIGH → MEDIUM → LOW priority
   - For each: say WHY it matters for these roles
   - If the skill fits an existing project → project_type: "existing", name the project
   - Otherwise → project_type: "new", propose a specific small project
   - implementation: WHAT to build → WHERE → HOW (one sentence)

3. PROJECT IMPROVEMENTS — for existing projects only:
   - Read the CANDIDATE PROJECT/EXPERIENCE EXCERPT to find existing projects.
   - Max 3 improvements
   - Each: WHAT → WHERE (project name) → HOW
   - Make impact measurable or user-visible

4. CV FIXES — max 3 short fixes:
   - Tie each fix to a specific section or project
   - Be specific: name the section, the exact change, and why

5. TOP ACTIONS — exactly 3:
   - Something the candidate can do this week
   - Include a concrete deliverable per action
   - Do not repeat themes across actions

---
RULES:
- Keep ALL explanations to 1-2 lines max
- Be specific: name projects, technologies, exact deliverables
- Do NOT invent projects, metrics, links, or technologies not found in the excerpt or skills list
- Use the full CV details when proposing top actions, project improvements, and new projects.
- missing_skills: max 5 entries
- project_improvements: max 3 entries
- cv_fixes: max 3 entries
- top_actions: exactly 3 entries

---
OUTPUT (STRICT JSON ONLY — no markdown fences):
{{
  "job_matches": [
    {{"title": "", "score": 0, "reason": "", "evidence": "", "gap": ""}}
  ],
  "missing_skills": [
    {{"skill": "", "priority": "HIGH|MEDIUM|LOW", "why": "",
      "project_type": "existing|new", "project": "",
      "project_idea": "", "implementation": "", "evidence": ""}}
  ],
  "project_improvements": [
    {{"project": "", "current_issue": "", "improvement": "", "impact": ""}}
  ],
  "cv_fixes": [
    {{"section": "", "fix": "", "why": "", "how": ""}}
  ],
  "top_actions": [
    {{"action": "", "section": "", "why": "", "how": ""}}
  ]
}}
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def analyze_cv(
    cv_text: str,
    jobs: list,
    links: list | None = None,
    cv_skills: list | None = None,
    projects: list | None = None,
) -> dict:
    """
    Main CV analysis entry point.

    Parameters
    ----------
    cv_text   : raw CV text (used only to extract skills/projects if not supplied)
    jobs      : pre-scored job list from RAGPipeline (already has matched_skills,
                missing_skills, score, overlap, etc.)
    links     : links found in the CV
    cv_skills : pre-extracted skills (avoids re-extraction if already available)
    project_context: text excerpt to use for projects, if not supplied will be extracted from cv_text
    """
    from utils.skill_extractor import extract_skills as _extract_skills

    links = links or []

    # --- Resolve cv_skills -----------------------------------------------
    if not cv_skills:
        cv_skills = _extract_skills(cv_text)

    # --- Fix C: cap at top 2 jobs -----------------------------------------
    top_jobs = jobs[:2]

    # --- Fix F: zero-overlap fast-path ------------------------------------
    total_overlap = sum(j.get("overlap", 0) for j in top_jobs)
    if total_overlap == 0 and len(top_jobs) > 0:
        print("[Analyzer] Zero overlap detected — returning template response (no LLM call)")
        template = dict(_ZERO_OVERLAP_TEMPLATE)
        # Populate job_matches from scored data so UI still shows jobs
        template["job_matches"] = [
            {
                "title": j.get("title", ""),
                "score": j.get("score", 0),
                "reason": "No skill overlap found between your CV and this role.",
                "evidence": "None",
                "gap": ", ".join(j.get("missing_skills", [])[:5]) or "See job description for required skills.",
            }
            for j in top_jobs
        ]
        return postprocess_analysis(template)

    # --- Fix B: build structured prompt context ---------------------------
    # Enrich each job with missing_skills (skills in job but not in CV)
    structured_jobs = []
    for j in top_jobs:
        job_matched = j.get("matched_skills", [])
        # Compute missing: job skills minus cv skills
        from utils.skill_extractor import extract_skills as _es
        job_text = j.get("title", "") + " " + j.get("description", "")
        job_skills_all = _es(job_text)
        missing = [s for s in job_skills_all if s not in cv_skills][:8]
        structured_jobs.append({
            "title": j.get("title", ""),
            "score": j.get("score", 0),
            "matched_skills": job_matched[:10],
            "missing_skills": missing,
        })

    # Extract project context (focused excerpt of CV text)
    full_cv_text = cv_text.strip()
    project_context = full_cv_text
    if cv_text:
        text_lower = cv_text.lower()
        idx = text_lower.find("project")
        if idx == -1:
            idx = text_lower.find("experience")

        if idx != -1:
            start = max(0, idx - 200)
            end = min(len(cv_text), idx + 3000)
            project_context = cv_text[start:end].strip()

    # --- Fix E: cache check -----------------------------------------------
    cache_key = _make_cache_key(cv_skills, structured_jobs, links)
    if cache_key in _analysis_cache:
        print("[Analyzer] Cache hit — returning cached result (no LLM call)")
        return _analysis_cache[cache_key]

    # --- Build and send compact prompt ------------------------------------
    prompt = _build_structured_prompt(cv_skills, structured_jobs, full_cv_text, project_context, links)

    try:
        response = generate_response(prompt, request_source="analysis")
        result = postprocess_analysis(response)
        # Store in cache
        _analysis_cache[cache_key] = result
        return result
    except Exception as e:
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
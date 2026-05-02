def _normalize_text(value):
    if value is None:
        return ""
    return str(value).strip()


def _dedupe_by_key(items, key):
    seen = set()
    out = []
    for item in items:
        token = _normalize_text(item.get(key, "")).lower()
        if not token or token in seen:
            continue
        seen.add(token)
        out.append(item)
    return out


def _section_confidence(items, required_fields):
    if not items:
        return "low"

    complete = 0
    for item in items:
        if all(_normalize_text(item.get(field, "")) for field in required_fields):
            complete += 1

    ratio = complete / len(items)
    if ratio >= 0.8:
        return "high"
    if ratio >= 0.5:
        return "medium"
    return "low"


def postprocess_analysis(analysis):
    if not isinstance(analysis, dict):
        return analysis
    if "error" in analysis:
        return analysis

    analysis.setdefault("job_matches", [])
    analysis.setdefault("missing_skills", [])
    analysis.setdefault("project_improvements", [])
    analysis.setdefault("cv_fixes", [])
    analysis.setdefault("top_actions", [])

    for match in analysis["job_matches"]:
        match["title"] = _normalize_text(match.get("title"))
        match["reason"] = _normalize_text(match.get("reason"))
        match["evidence"] = _normalize_text(match.get("evidence"))
        match["gap"] = _normalize_text(match.get("gap"))

    for skill in analysis["missing_skills"]:
        skill["skill"] = _normalize_text(skill.get("skill"))
        skill["why"] = _normalize_text(skill.get("why"))
        skill["project_type"] = _normalize_text(skill.get("project_type") or "existing").lower()
        if skill["project_type"] not in {"existing", "new"}:
            skill["project_type"] = "existing"

        skill["project"] = _normalize_text(skill.get("project"))
        skill["project_idea"] = _normalize_text(skill.get("project_idea"))
        skill["implementation"] = _normalize_text(skill.get("implementation"))
        skill["evidence"] = _normalize_text(skill.get("evidence"))

    # Guarantee at least one new project suggestion.
    if not any(item.get("project_type") == "new" for item in analysis["missing_skills"]):
        seed_skill = (
            analysis["missing_skills"][0]["skill"]
            if analysis["missing_skills"]
            else "Deployment and production readiness"
        )
        analysis["missing_skills"].append(
            {
                "skill": seed_skill,
                "priority": "MEDIUM",
                "why": "A dedicated project helps demonstrate missing skills with clear ownership and measurable outcomes.",
                "project_type": "new",
                "project": "FastAPI Production Readiness Starter",
                "project_idea": "Build a small API service with Docker, tests, and docs as a portfolio-ready deployment sample.",
                "implementation": "Create a FastAPI service, add pytest tests, dockerize with docker-compose, and publish Swagger docs.",
                "evidence": "No explicit standalone project currently demonstrates this gap end-to-end.",
            }
        )

    for improvement in analysis["project_improvements"]:
        improvement["project"] = _normalize_text(improvement.get("project"))
        improvement["current_issue"] = _normalize_text(improvement.get("current_issue"))
        improvement["improvement"] = _normalize_text(improvement.get("improvement"))
        improvement["impact"] = _normalize_text(improvement.get("impact"))

        if improvement["improvement"].lower() == improvement["impact"].lower():
            improvement["impact"] = "Improves reliability, portfolio quality, and recruiter-visible project maturity."

    for fix in analysis["cv_fixes"]:
        fix["section"] = _normalize_text(fix.get("section"))
        fix["fix"] = _normalize_text(fix.get("fix"))
        fix["why"] = _normalize_text(fix.get("why"))
        fix["how"] = _normalize_text(fix.get("how"))

    for action in analysis["top_actions"]:
        action["action"] = _normalize_text(action.get("action"))
        action["section"] = _normalize_text(action.get("section"))
        action["why"] = _normalize_text(action.get("why"))
        action["how"] = _normalize_text(action.get("how"))

    # Remove exact duplicates and enforce hard output limits (Fix D).
    analysis["missing_skills"] = _dedupe_by_key(analysis["missing_skills"], "skill")[:5]
    analysis["project_improvements"] = _dedupe_by_key(analysis["project_improvements"], "improvement")[:3]
    analysis["cv_fixes"] = _dedupe_by_key(analysis["cv_fixes"], "fix")[:3]
    analysis["top_actions"] = _dedupe_by_key(analysis["top_actions"], "action")[:3]

    analysis["confidence"] = {
        "job_matches": _section_confidence(
            analysis["job_matches"], ["title", "reason", "evidence", "gap"]
        ),
        "missing_skills": _section_confidence(
            analysis["missing_skills"],
            ["skill", "why", "project_type", "implementation", "evidence"],
        ),
        "project_improvements": _section_confidence(
            analysis["project_improvements"],
            ["project", "current_issue", "improvement", "impact"],
        ),
        "cv_fixes": _section_confidence(
            analysis["cv_fixes"], ["section", "fix", "why", "how"]
        ),
        "top_actions": _section_confidence(
            analysis["top_actions"], ["action", "section", "why", "how"]
        ),
    }

    return analysis

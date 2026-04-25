from ai.llm import generate_response

def analyze_cv(cv_text, jobs):
    # Combine top jobs into context
    job_context = ""
    for job in jobs:
        job_context += f"\nJob Title: {job['title']}\nDescription: {job['description']}\n"

    prompt = f"""
You are an AI career assistant.

Given the following CV:
{cv_text[:2000]}

And these job descriptions:
{job_context}

Tasks:
1. Explain how well the CV matches these jobs
2. Identify missing skills
3. Suggest specific improvements (projects, skills, changes)

Be specific and actionable.
"""

    return generate_response(prompt)
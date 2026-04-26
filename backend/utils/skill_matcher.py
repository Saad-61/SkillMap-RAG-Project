def compute_overlap(cv_skills, job_skills_map):
    overlap_map = {}

    for job_id, job_skills in job_skills_map.items():
        overlap = len(set(cv_skills) & set(job_skills))
        overlap_map[job_id] = overlap

    return overlap_map
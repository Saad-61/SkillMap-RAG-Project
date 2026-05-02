import os
import requests
import logging
from utils.html_cleaner import clean_job_description

logger = logging.getLogger(__name__)

def fetch_remotive():
    url = "https://remotive.com/api/remote-jobs"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()

        jobs = []
        for job in data.get("jobs", [])[:20]:
            raw_job = {
                "id": str(job["id"]),
                "title": job["title"],
                "description": job["description"],
                "url": job.get("url", ""),
                "company_name": job.get("company_name", ""),
            }
            cleaned_job = clean_job_description(raw_job)
            jobs.append(cleaned_job)
        return jobs
    except Exception as e:
        logger.error(f"Error fetching from Remotive: {e}")
        return []

def fetch_jobicy():
    url = "https://jobicy.com/api/v2/remote-jobs?count=20"
    
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
        data = res.json()

        jobs = []
        for job in data.get("jobs", []):
            raw_job = {
                "id": str(job["id"]),
                "title": job["jobTitle"],
                "description": job["jobDescription"],
                "url": job.get("url", ""),
                "company_name": job.get("companyName", ""),
            }
            cleaned_job = clean_job_description(raw_job)
            jobs.append(cleaned_job)
        return jobs
    except Exception as e:
        logger.error(f"Error fetching from Jobicy: {e}")
        return []

def get_all_jobs():
    jobs = []
    
    # We fetch jobs from various APIs, handling errors gracefully inside each function
    jobs.extend(fetch_remotive())
    jobs.extend(fetch_jobicy())

    return jobs

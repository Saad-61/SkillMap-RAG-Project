import requests
import time
from utils.html_cleaner import clean_job_description

class JobCache:
    def __init__(self):
        self.jobs = None
        self.last_fetch = 0
        self.cache_duration = 3600  # 1 hour

    def get_jobs(self):
        current_time = time.time()
        if self.jobs is None or (current_time - self.last_fetch) > self.cache_duration:
            self.jobs = self._fetch_from_api()
            self.last_fetch = current_time
        return self.jobs

    def _fetch_from_api(self):
        url = "https://remotive.com/api/remote-jobs"
        res = requests.get(url)
        data = res.json()

        jobs = []
        for job in data["jobs"][:50]:
            raw_job = {
                "id": job["id"],
                "title": job["title"],
                "description": job["description"],
                "url": job.get("url", ""),
                "company_name": job.get("company_name", ""),
            }
            # Clean HTML from job description
            cleaned_job = clean_job_description(raw_job)
            jobs.append(cleaned_job)
        return jobs

    def clear_cache(self):
        self.jobs = None
        self.last_fetch = 0


# Global cache instance
_job_cache = JobCache()

def fetch_jobs():
    """Fetch jobs with caching (1-hour TTL)"""
    return _job_cache.get_jobs()

def clear_job_cache():
    """Clear the job cache (for manual refresh)"""
    _job_cache.clear_cache()
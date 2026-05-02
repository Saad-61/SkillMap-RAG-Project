import json
import time
import os
from pathlib import Path
from services.fetch_jobs import get_all_jobs

# Data directory relative to this file
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CACHE_FILE = DATA_DIR / "jobs_cache.json"
CACHE_EXPIRY = 60 * 60 * 6  # 6 hours

def get_cached_jobs():
    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    if CACHE_FILE.exists():
        try:
            data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
            
            if time.time() - data.get("timestamp", 0) < CACHE_EXPIRY:
                return data["jobs"]
        except Exception as e:
            # If JSON is corrupted or invalid, we will re-fetch
            pass

    # Refresh cache
    jobs = get_all_jobs()

    try:
        CACHE_FILE.write_text(json.dumps({
            "timestamp": time.time(),
            "jobs": jobs
        }, indent=2), encoding="utf-8")
    except Exception as e:
        print(f"Failed to write cache file: {e}")

    return jobs

def clear_job_cache():
    """Clear the job cache (for manual refresh)"""
    if CACHE_FILE.exists():
        CACHE_FILE.unlink()

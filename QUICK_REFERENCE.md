## Quick Reference: New Features

### 1. Job Cache Usage
```python
from services.job_fetcher import fetch_jobs, clear_job_cache

# Auto-cached for 1 hour
jobs = fetch_jobs()

# Manual refresh if needed
clear_job_cache()
jobs = fetch_jobs()  # Fresh fetch
```

### 2. Hybrid Scoring Formula
**How scores now work:**
- 60% weight on embedding similarity (semantic match)
- 40% weight on skill overlap (skills from CV matching job)
- 30% penalty if zero skills overlap

**Score Range:** 0-100 (no more clustered 40-60)

### 3. Results Contain
```json
{
  "matched_jobs": [
    {
      "id": "...",
      "title": "...",
      "score": 58.5,           // NEW: Hybrid score
      "overlap": 3,             // Number of matched skills
      "matched_skills": [...],  // NEW: List of matched skills
      "evidence": "Matched: FastAPI, PostgreSQL, React"  // NEW
    }
  ],
  "links": [...],
  "resume_score": 72,          // NEW: Overall resume quality (0-100)
  "result_id": "..."           // NEW: Unique ID for this analysis
}
```

### 4. Results History API
```python
from models.history import (
    save_analysis_result,
    get_analysis_result,
    get_cv_analysis_history,
    get_all_analyses
)

# Results are auto-saved on /cv/analyze endpoint
# But you can also use these functions directly

# Get specific result
result = get_analysis_result("2024-01-15T10:30:45.123456__resume.pdf")

# Get all analyses for a CV
history = get_cv_analysis_history("resume.pdf")

# Get recent analyses
recent = get_all_analyses(limit=20)
```

### 5. Resume Score Breakdown
- **Skills:** 5 points per unique skill (max 40)
- **Projects:** 3 points per mention of "project"/"built"/"developed" (max 30)
- **Links:** 10 points per GitHub/portfolio link (max 30)
- **Total:** 0-100

Example: 7 skills (35) + 5 projects (15) + 2 links (20) = 70/100

### 6. Storage
- Results saved to: `backend/models/history.json`
- Auto-created on first use
- JSON format for easy database migration
- Delete anytime - will auto-recreate

### 7. For Production Database Migration
When ready to use a real database:
1. Edit `backend/models/history.py`
2. Override `_load_history()` and `_save_history()` methods
3. Point to MongoDB/PostgreSQL/etc
4. API doesn't change - drop-in replacement

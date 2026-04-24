# API Documentation

## 1. Upload CV
POST /upload-cv
- Input: file
- Output: extracted text

---

## 2. Get Job Matches
POST /match-jobs
- Input: CV text
- Output:
  - job list
  - match scores

---

## 3. Skill Gap Analysis
POST /skill-gap
- Input: CV + job
- Output:
  - missing skills
  - weak areas

---

## 4. Improvement Suggestions
POST /suggestions
- Input: CV + job analysis
- Output:
  - actionable improvements

---

## 5. Get Insights
GET /insights
- Output:
  - trends across jobs
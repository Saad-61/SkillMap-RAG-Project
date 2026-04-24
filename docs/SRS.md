# Software Requirements Specification (SRS)

## 1. Functional Requirements

### 1.1 Upload CV
- User can upload CV (PDF/DOCX)
- System extracts text

### 1.2 Job Retrieval (RAG)
- System retrieves relevant job postings based on CV
- Uses vector similarity search

### 1.3 Job Matching
- Calculate match score between CV and job
- Display top matching jobs

### 1.4 Skill Gap Analysis
- Identify missing skills
- Identify weak areas

### 1.5 Improvement Suggestions
- Suggest actionable improvements
- Suggest project-based improvements

### 1.6 Multi-job Insights
- Show patterns across multiple jobs
- Example: “80% of jobs require Docker”

---

## 2. Non-Functional Requirements

- Fast response time (<3 seconds)
- Scalable backend
- Clean UI/UX
- Secure file handling

---

## 3. Constraints
- Limited access to job APIs
- Data scraping limitations

---

## 4. Assumptions
- Users upload well-formatted CVs
- Job data is available via scraping or datasets
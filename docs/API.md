# API Documentation

## Base URL
```
http://127.0.0.1:8010
```

## Authentication
Currently no authentication required. All endpoints are public.

---

## Endpoints

### 1. Upload CV Preview
**POST** `/cv/upload`

Uploads a CV file and returns a text preview for validation.

**Request:**
```bash
curl -X POST -F "file=@resume.pdf" http://127.0.0.1:8010/cv/upload
```

**Parameters:**
- `file` (required): PDF or DOCX file

**Response (200):**
```json
{
  "filename": "resume.pdf",
  "preview": "John Doe\nSoftware Engineer...\n[first 500 characters]"
}
```

**Error Responses:**
- `400` – File type not supported (only PDF/DOCX)
- `500` – File processing error

---

### 2. Match Jobs (Simple Retrieval)
**POST** `/cv/match-jobs`

Retrieves job postings matching the CV without detailed scoring or analysis.

**Request:**
```bash
curl -X POST -F "file=@resume.pdf" http://127.0.0.1:8010/cv/match-jobs
```

**Response (200):**
```json
{
  "matched_jobs": [
    {
      "id": 0,
      "title": "Backend Engineer",
      "description": "We are looking for a backend engineer with 5+ years..."
    },
    {
      "id": 1,
      "title": "Full Stack Developer",
      "description": "Join our team as a full stack developer..."
    }
  ]
}
```

---

### 3. Full CV Analysis (RAG Pipeline)
**POST** `/cv/analyze`

**The main endpoint.** Runs the complete RAG + LLM pipeline:
1. Extracts CV text and links
2. Retrieves matched jobs with semantic + skill-based scoring
3. Generates LLM analysis with confidence metadata
4. Returns post-processed results

**Request:**
```bash
curl -X POST -F "file=@resume.pdf" http://127.0.0.1:8010/cv/analyze
```

**Response (200):**
```json
{
  "matched_jobs": [
    {
      "id": 0,
      "title": "Backend Engineer",
      "description": "...",
      "score": 78,
      "evidence": "Strong Python and FastAPI experience matches role requirements.",
      "gap": "Missing Docker/Kubernetes expertise required for deployment."
    }
  ],
  "links": [
    "https://github.com/johndoe",
    "https://linkedin.com/in/johndoe"
  ],
  "analysis": {
    "job_matching": [
      {
        "job_id": 0,
        "match_explanation": "Your FastAPI experience...",
        "confidence": "high"
      }
    ],
    "missing_skills": [
      {
        "skill": "Docker",
        "priority": "HIGH",
        "project_type": "new",
        "project_name": "Containerized Task Queue",
        "implementation": "Build a simple task queue with Docker, FastAPI, and Redis. Deploy via docker-compose."
      }
    ],
    "project_improvements": [
      {
        "improvement": "Add WebSocket for real-time updates",
        "where": "FastAPI backend",
        "how": "Integrate FastAPI WebSockets with a simple pub-sub model.",
        "impact": "Enables 50ms latency updates for client notifications."
      }
    ],
    "cv_fixes": [
      {
        "fix": "Add GitHub link to Projects section",
        "section": "Projects",
        "reason": "Interviewers expect code samples; top jobs mention portfolio links."
      }
    ],
    "top_actions": [
      {
        "action": "Deploy one project to Docker",
        "deliverable": "Push a working docker-compose.yml to GitHub",
        "why": "Docker is mentioned in 80% of matched backend jobs."
      },
      {
        "action": "Add LinkedIn to CV",
        "deliverable": "Updated resume with LinkedIn URL in header",
        "why": "Improves recruiter discovery; required by 60% of job descriptions."
      },
      {
        "action": "Complete one Kubernetes tutorial",
        "deliverable": "Deploy a simple app on Minikube, push to GitHub",
        "why": "K8s is a top missing skill; weekend project scope."
      }
    ]
  }
}
```

**Response Fields:**

- **matched_jobs** (array)
  - `id`: Job index
  - `title`: Job title
  - `description`: Full job description
  - `score`: Match score [0-100]. Formula: `(1/(1+distance)*100) + (skill_overlap*8) - penalty`
  - `evidence`: Why CV matches (specific CV skills)
  - `gap`: What's missing (specific job requirement)

- **links** (array of strings)
  - GitHub, LinkedIn, portfolio URLs extracted from:
    - PDF hyperlinks (clickable links in PDF)
    - Plain text patterns (https://github.com/...)

- **analysis** (object)
  - **job_matching**: Match explanations with confidence (high/medium/low)
  - **missing_skills**: Priority-sorted skills with project recommendations
    - `project_type`: "existing" (apply to current project) or "new" (suggest new project)
    - `implementation`: WHAT→WHERE→HOW format
  - **project_improvements**: Enhancements to existing projects (WHAT→WHERE→HOW→IMPACT)
  - **cv_fixes**: Specific CV section updates
  - **top_actions**: Top 3 actionable next steps (deliverable-focused)

**Error Responses:**
- `400` – File type not supported
- `500` – LLM API error (check GEMINI_API_KEY)
- `502` – LLM response parsing failed

---

## Scoring Formula

```
base_score = (1 / (1 + cosine_distance)) * 100
skill_overlap = number_of_matching_skills
penalty = jobs_with_zero_overlap_filtered

final_score = clamp(base_score + (skill_overlap * 8) - penalty, 0, 100)
```

**Example:**
- Cosine distance: 0.2 → base_score = (1 / 1.2) * 100 = 83
- Skill overlap: 3 skills → +24 points
- Zero-overlap penalty: 0 (no filtering applied)
- **Final: 83 + 24 = 107 → clamped to 100**

---

## Post-Processing Quality Guarantees

Every response is post-processed to ensure:
1. **Null Normalization**: Null values converted to empty arrays/strings
2. **Deduplication**: Duplicate fixes/actions removed by key
3. **Confidence Metadata**: Each section labeled high/medium/low
4. **New Project Guarantee**: At least one `project_type: "new"` in missing_skills
5. **Text Normalization**: Whitespace trimmed, consistent formatting

---

## Rate Limiting

Currently no rate limiting. For production:
- Recommend: 10 requests/min per IP
- LLM latency: ~3-5 seconds per analysis

---

## Environment Variables

Required in `.env`:
```
GEMINI_API_KEY=your_google_gemini_api_key
HF_TOKEN=your_huggingface_token (optional, for future features)
```

---

## Example Workflow

```bash
# 1. Upload CV to preview
curl -X POST -F "file=@resume.pdf" http://127.0.0.1:8010/cv/upload

# 2. Run full analysis
curl -X POST -F "file=@resume.pdf" http://127.0.0.1:8010/cv/analyze > analysis.json

# 3. Parse results and display to user
jq '.analysis.top_actions' analysis.json
```
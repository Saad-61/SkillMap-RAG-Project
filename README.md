# AI Job Match & Career Optimizer (RAG-Based)

## 🚀 Overview

An AI-powered system that analyzes a user's CV and matches it with real-world job postings using a Retrieval-Augmented Generation (RAG) pipeline. The system provides evidence-based, actionable feedback tied to real job market data.

**Key Features:**
* **Intelligent Job Matching** – Semantic similarity + skill-based scoring with evidence
* **Link Detection** – Extracts GitHub, LinkedIn, and portfolio links from PDF and text
* **Skill Gap Analysis** – Identifies missing skills with concrete project recommendations
* **Confidence Metadata** – Every output section includes confidence levels (high/medium/low)
* **Actionable Advice** – WHAT→WHERE→HOW format ensures concrete, implementable suggestions
* **Post-Processing Quality** – Deterministic deduplication and normalization for consistency

---

## 🎯 Problem Statement

Traditional CV analyzers provide generic feedback disconnected from real job requirements:
* No evidence-based matching
* Vague suggestions ("improve UI" instead of "add WebSocket for real-time updates in Project X")
* No link to actual market demand
* No quality guarantee on output

---

## 💡 Solution

This system retrieves actual job postings, scores the CV against them, and uses an LLM to generate:
1. **Matched jobs** with evidence-based explanations
2. **Missing skills** tied to real job descriptions, with practical project ideas
3. **CV improvements** with specific implementation guidance
4. **Links** extracted from both PDF hyperlinks and text
5. **Top actions** – concrete, deliverable-focused next steps

---

## 🧠 AI Architecture (RAG)

### Retrieval Pipeline
1. Job postings stored in FAISS vector database (embeddings via `sentence-transformers`)
2. User CV converted to embedding
3. Semantic similarity search + skill-based scoring
4. Filtering: remove zero-overlap jobs, fallback to top 2 if empty
5. Scoring formula: `(1/(1+distance)*100) + (skill_overlap*8) - penalty`, clamped [0, 100]

### Analysis Pipeline
1. Extract text and links from uploaded CV (PDF/DOCX)
2. Retrieve matched jobs with scores
3. Build evidence-based prompt with job context
4. Generate LLM analysis:
   - Job match explanations (with CV evidence + job gap)
   - Missing skills with priority (HIGH/MEDIUM/LOW)
   - Project improvements (existing projects only)
   - CV fixes (specific, tied to sections)
   - Top 3 weekly actions
5. Post-process: normalize nulls, deduplicate, add confidence, guarantee ≥1 new-project suggestion

---

## 🛠️ Tech Stack

### Backend

* **FastAPI** – REST API framework
* **Uvicorn** – ASGI server (default port: 8010)
* **Pydantic** – Data validation

### AI / ML Stack

* **Embeddings:** sentence-transformers (`all-MiniLM-L6-v2`)
* **Vector DB:** FAISS (IndexFlatL2)
* **LLM:** Google Gemini 2.0 Flash with dynamic model resolution
* **JSON Parsing:** Multi-stage parser (direct → fenced blocks → streaming decode)

### File Parsing

* **PyMuPDF (fitz)** – PDF extraction + hyperlink detection
* **python-docx** – DOCX extraction
* **Regex + Pattern Matching** – Link extraction from text

### Dependencies

See [backend/requirements.txt](backend/requirements.txt) for full list.

---

## 📋 API Endpoints

### 1. Upload CV
**POST** `/cv/upload`  
Uploads and previews a CV file.

**Input:** multipart/form-data with file (PDF/DOCX)  
**Output:**
```json
{
  "filename": "resume.pdf",
  "preview": "John Doe... [first 500 chars]"
}
```

---

### 2. Match Jobs (Simple)
**POST** `/cv/match-jobs`  
Retrieves basic job matches without scoring.

**Input:** multipart/form-data with file  
**Output:**
```json
{
  "matched_jobs": [
    {
      "id": 0,
      "title": "Backend Engineer",
      "description": "..."
    }
  ]
}
```

---

### 3. Analyze CV (Full Pipeline)
**POST** `/cv/analyze`  
Runs the complete RAG + LLM analysis pipeline.

**Input:** multipart/form-data with file  
**Output:**
```json
{
  "matched_jobs": [
    {
      "id": 0,
      "title": "Backend Engineer",
      "description": "...",
      "score": 78,
      "evidence": "Strong Python/FastAPI background...",
      "gap": "Missing Docker and Kubernetes experience"
    }
  ],
  "links": ["https://github.com/user", "https://linkedin.com/in/user"],
  "analysis": {
    "job_matching": [...],
    "missing_skills": [...],
    "project_improvements": [...],
    "cv_fixes": [...],
    "top_actions": [...]
  }
}
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- pip or venv

### Installation

1. **Clone the repo**
   ```bash
   git clone <repo>
   cd "RAG project"
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   # or: source .venv/bin/activate  # macOS/Linux
   ```

3. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add:
   ```
   HF_TOKEN=your_huggingface_token
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

5. **Run the backend**
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
   ```

### Frontend (Vite + React)

1. **Install frontend deps**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the frontend**
   ```bash
   npm run dev
   ```

The frontend runs on `http://127.0.0.1:5173` and proxies API requests to the backend on `http://127.0.0.1:8010` via `/api/*`.

6. **Test the API**
   ```bash
   curl -X POST -F "file=@resume.pdf" http://127.0.0.1:8010/cv/analyze
   ```

See [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for detailed setup instructions.

---

## 📚 Documentation

* [API.md](docs/API.md) – Detailed endpoint documentation
* [AI_DESIGN.md](docs/AI_DESIGN.md) – RAG pipeline, scoring formula, post-processing
* [TECH_STACK.md](docs/TECH_STACK.md) – Technology choices and rationale
* [SRS.md](docs/SRS.md) – Software requirements
* [SETUP_GUIDE.md](docs/SETUP_GUIDE.md) – Environment setup and deployment

---

## 🧪 Testing

Run tests:
```bash
pytest backend/tests/
```

---

## 📦 Future Enhancements

* Resume rewriting assistant
* Portfolio optimization suggestions
* Live job scraping and data updates
* Redis caching for embeddings
* Frontend dashboard
* Batch CV analysis

---

## ⚡ Project Goal

Build a real-world AI system that bridges the gap between user skills and job market demands using evidence-based retrieval and reasoning.

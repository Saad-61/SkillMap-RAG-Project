# AI Design & Architecture

## Overview

The RAG (Retrieval-Augmented Generation) pipeline combines semantic search with skill-based scoring to retrieve relevant jobs and uses an LLM to generate evidence-based analysis.

---

## Architecture Diagram

```
┌─────────────────┐
│   User CV File  │ (PDF/DOCX)
└────────┬────────┘
         │
         ▼
    ┌─────────────────────┐
    │ Extract Text & Links│ (PyMuPDF + regex)
    └────────┬────────────┘
             │
        ┌────┴───────────────────────────────┐
        │                                    │
        ▼                                    ▼
   ┌─────────┐                       ┌──────────────┐
   │   Text  │                       │   Links      │
   │         │                       │ (GitHub/     │
   └────┬────┘                       │  LinkedIn)   │
        │                            └──────┬───────┘
        │                                   │
        ▼                                   │
   ┌─────────────────────┐                  │
   │ Embed CV Text       │                  │
   │ (sentence-          │                  │
   │  transformers)      │                  │
   └────┬────────────────┘                  │
        │                                   │
        ▼                                   │
   ┌─────────────────────┐                  │
   │ Semantic Search in  │                  │
   │ FAISS Vector DB     │                  │
   │ (top 20 similar)    │                  │
   └────┬────────────────┘                  │
        │                                   │
        ▼                                   │
   ┌─────────────────────┐                  │
   │ Skill Overlap       │                  │
   │ Scoring & Filtering │                  │
   │ (0-100 score)       │                  │
   └────┬────────────────┘                  │
        │                                   │
        ├───────────┬──────────────────────┬┤
        │           │                      ││
        ▼           ▼                      ▼▼
    ┌────────┐  ┌────────┐            ┌──────────┐
    │ Matched│  │Evidence│            │ Extracted│
    │ Jobs   │  │  & Gaps│            │  Links   │
    └────┬───┘  └────┬───┘            └────┬─────┘
         │           │                     │
         └───────────┼─────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  LLM Analysis   │
            │  (Gemini API)   │
            │ ─────────────── │
            │ • Match explain │
            │ • Missing skills│
            │ • Improvements  │
            │ • CV fixes      │
            │ • Top actions   │
            └────┬────────────┘
                 │
                 ▼
          ┌──────────────────┐
          │ Post-Processing  │
          │ ──────────────── │
          │ • Deduplicate    │
          │ • Normalize      │
          │ • Add confidence │
          │ • Quality check  │
          └────┬─────────────┘
               │
               ▼
          ┌─────────────┐
          │ JSON Output │
          │ to Client   │
          └─────────────┘
```

---

## 1. Retrieval Pipeline

### 1.1 Text Extraction
- **Input**: CV file (PDF or DOCX)
- **Tools**: 
  - PyMuPDF (fitz) for PDF
  - python-docx for DOCX
- **Output**: Plain text (CV content)
- **Performance**: <500ms per file

### 1.2 Embedding Generation
- **Model**: sentence-transformers `all-MiniLM-L6-v2`
- **Input**: CV text
- **Output**: 384-dimensional dense vector
- **Lazy Loading**: Initialized on first request
- **Performance**: <100ms per embedding

### 1.3 Similarity Search
- **Index**: FAISS IndexFlatL2
- **Algorithm**: Exhaustive search (L2 distance)
- **Input**: CV embedding
- **Output**: Top 20 most similar jobs
- **Distance Metric**: 
  ```
  L2 distance between CV and job embeddings
  Converted to similarity: 1 / (1 + distance)
  ```
- **Performance**: <50ms with 100 jobs

### 1.4 Skill-Based Scoring

**Algorithm**:
```python
# Extract skills from CV and job description
cv_skills = extract_skills(cv_text)
job_skills = extract_skills(job_description)

# Calculate overlap
skill_overlap = len(cv_skills ∩ job_skills)

# Calculate base score from semantic similarity
base_score = (1 / (1 + l2_distance)) * 100

# Apply skill bonus
skill_bonus = skill_overlap * 8

# Penalty for zero-overlap jobs (optional filtering)
penalty = 0 if skill_overlap > 0 else remove_from_results

# Final score
final_score = clamp(base_score + skill_bonus - penalty, 0, 100)
```

**Example**:
- Semantic similarity distance: 0.2 → base_score = 83
- Skill overlap: 3 skills → bonus = 24
- Zero-overlap penalty: 0 (job has at least 1 skill match)
- **Final**: 83 + 24 = 107 → clamped to **100**

### 1.5 Filtering & Fallback

**Filtering Logic**:
1. Remove all jobs with zero skill overlap
2. Sort remaining jobs by score (descending)
3. Return top N jobs

**Fallback**:
- If all jobs filtered out (zero overlap for all): return top 2 jobs anyway
- Ensures user always sees some matches, even if not perfect

**Output**:
```json
{
  "matched_jobs": [
    {
      "id": 0,
      "title": "Backend Engineer",
      "description": "...",
      "score": 78,
      "evidence": "Strong Python/FastAPI experience...",
      "gap": "Missing Docker experience..."
    }
  ]
}
```

---

## 2. Link Extraction

### 2.1 PDF Hyperlinks
- Extract clickable links from PDF annotations
- PyMuPDF `page.get_links()` returns URIs
- Common formats:
  - https://github.com/username
  - https://linkedin.com/in/username
  - Custom portfolio URLs

### 2.2 Text Pattern Matching
- Regex patterns for URLs and contact info:
  ```
  - Full URL: https?://\S+
  - GitHub: github\.com/[\w-]+
  - LinkedIn: linkedin\.com/in/[\w-]+
  ```
- Handles trailing punctuation cleanup

### 2.3 Deduplication
- Combine PDF links + text links
- Remove duplicates
- Return sorted, unique list

**Output**:
```json
{
  "links": [
    "https://github.com/johndoe",
    "https://linkedin.com/in/johndoe",
    "https://portfolio.example.com"
  ]
}
```

---

## 3. Analysis Pipeline (LLM)

### 3.1 Prompt Engineering

**Goal**: Generate specific, evidence-based analysis instead of generic feedback.

**Prompt Structure**:
```
You are an AI career assistant.

[CV CONTEXT]
CV:
  <full CV text>

[JOB CONTEXT]
JOBS:
  Title: Backend Engineer
  Description: ...
  Score: 78
  [repeat for top N jobs]

[LINKS FOUND]
LINKS IN CV:
  https://github.com/...

[ANALYSIS TASKS]
1. JOB MATCHING
   - Use provided scores as base (don't change significantly)
   - Explain match citing specific CV skills + job gaps
   - Be concrete, not generic

2. MISSING SKILLS ANALYSIS
   - Identify skills from jobs that CV lacks
   - Prioritize: HIGH / MEDIUM / LOW
   - For each skill:
     * If can apply to existing project → suggest that
     * Else → suggest new practical project
   - Guarantee at least one new project

3. PROJECT IMPROVEMENTS
   - Only for existing CV projects
   - Format: WHAT → WHERE → HOW → IMPACT
   - Example: Add WebSocket → FastAPI backend → native WebSocket class → 50ms latency

4. CV FIXES
   - Specific updates to sections
   - Example: Add GitHub link to Projects section
   - Avoid generic advice

5. TOP ACTIONS
   - Top 3 concrete next steps
   - Deliverable-focused
   - Achievable in one week
```

### 3.2 LLM Configuration

- **Model**: Google Gemini 2.0 Flash (primary), fallback to 1.5 Flash
- **Temperature**: Default (0.7, for variety in suggestions)
- **Max Tokens**: 2048 (sufficient for detailed analysis)
- **API**: google.generativeai Python client
- **Error Handling**: Multi-stage JSON parser

### 3.3 JSON Parsing

**Challenge**: LLMs sometimes return partially-formatted JSON:
```
Here's the analysis:
```json
{ "key": "value" }
```
Additional commentary...
```

**Solution - Multi-Stage Parser**:
1. **Direct Parse**: Try `json.loads(response)` first
2. **Fenced Block Extraction**: Extract from ```json ... ``` blocks
3. **Streaming Decode**: Parse char-by-char, stop at first valid JSON object
4. **Fallback**: Return structured error response

**Result**: Robust parsing that handles real-world LLM output variability.

---

## 4. Post-Processing

### 4.1 Quality Guarantees

**Normalization**:
- Convert null → empty arrays/strings
- Strip whitespace from all text fields
- Consistent formatting

**Deduplication**:
- Remove duplicate fixes by key
- Remove duplicate actions by key
- Group by section

**Confidence Metadata**:
- Calculate per section: high / medium / low
- Based on:
  - Count of items
  - Specificity of evidence
  - Matching job count

**New Project Guarantee**:
- If missing_skills has no `project_type: "new"`:
  - Convert one HIGH-priority skill to new project
  - Generate practical project idea
- Ensures user always has greenfield opportunity

**Example**:
```json
{
  "missing_skills": [
    {
      "skill": "Docker",
      "priority": "HIGH",
      "project_type": "new",
      "project_name": "Containerized Task Queue",
      "implementation": "...",
      "confidence": "high"
    }
  ]
}
```

### 4.2 Post-Processor Module

**Location**: `backend/utils/analysis_postprocess.py`

**Functions**:
- `postprocess_analysis(analysis)` – Main entry
- `_normalize_text(value)` – Handle nulls, strip whitespace
- `_dedupe_by_key(items, key)` – Remove duplicates
- `_section_confidence(items, required_fields)` – Calculate confidence

**Benefits**:
- Separates generation (LLM) from quality control
- Testable and reusable
- Easy to extend with new rules

---

## 5. Scoring Formula Deep Dive

### 5.1 Components

**Semantic Similarity**:
- Cosine distance between CV and job embeddings (L2 norm)
- Range: [0, 2] (0 = identical, 2 = opposite)
- Converted to score: `(1 / (1 + distance)) * 100`
- Example: distance 0.2 → score 83

**Skill Overlap**:
- Count of matching skills between CV and job
- Extracted using keyword matching
- Weighted: `overlap_count * 8` (bonus points)
- Example: 3 matching skills → +24 points

**Penalty System**:
- Zero-overlap jobs filtered out initially
- If all filtered: fallback to top 2 (no penalty)
- If some remain: penalty = 0

### 5.2 Formula

```
base_score = (1 / (1 + l2_distance)) * 100
skill_overlap = count_matching_skills

final_score = clamp(
  base_score + (skill_overlap * 8),
  min=0,
  max=100
)

// Filtering: Remove if skill_overlap == 0
// Fallback: If all removed, return top 2 anyway
```

### 5.3 Calibration

**Why these weights?**
- Base score [0-100]: Reflects semantic similarity
- Skill overlap * 8: Each skill worth ~8-10 points
  - 1 skill: +8 (weak match)
  - 3 skills: +24 (strong match)
  - 5+ skills: +40+ (excellent match, but clamped at 100)

**Validation**:
- Random CV + random job (no overlap) → score 0-20 (low)
- CV with all job skills (perfect overlap) → score 90-100 (high)
- Typical case (50% skill overlap) → score 60-75 (medium)

---

## 6. Data Flow

### 6.1 Request → Response

```
1. Client uploads CV file
   │
   ▼
2. Save file to backend/uploads/
   │
   ▼
3. Extract text + links (cv_parser.py)
   │
   ├─→ extract_text_from_file()
   │
   └─→ extract_links_from_file()
   │
   ▼
4. RAG Pipeline (rag_pipeline.py)
   │
   ├─→ Embed CV text
   │
   ├─→ Search FAISS index
   │
   ├─→ Score and filter jobs
   │
   └─→ Return matched_jobs + evidence
   │
   ▼
5. LLM Analysis (analyzer.py + llm.py)
   │
   ├─→ Build prompt with CV + jobs
   │
   ├─→ Call Gemini API
   │
   ├─→ Parse JSON response
   │
   └─→ Return analysis
   │
   ▼
6. Post-Processing (analysis_postprocess.py)
   │
   ├─→ Normalize nulls
   │
   ├─→ Deduplicate
   │
   ├─→ Add confidence
   │
   ├─→ Guarantee new project
   │
   └─→ Return final output
   │
   ▼
7. Client receives JSON response
```

### 6.2 Response Structure

```json
{
  "matched_jobs": [...],
  "links": [...],
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

## 7. Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| CV text extraction | <500ms | PDF/DOCX parsing |
| Embedding CV | <100ms | Lazy load + cache |
| FAISS search | <50ms | 100 jobs |
| LLM API call | 2-5s | Bottleneck |
| JSON parsing | <10ms | Multi-stage |
| Post-processing | <5ms | Deterministic |
| **Total** | **~3-6s** | LLM dominates |

---

## 8. Scalability Roadmap

### MVP (Current)
- In-memory FAISS (~10 jobs)
- Seed job data (JSON)
- Single-process Uvicorn
- **Limit**: 10-100 jobs

### Phase 1
- PostgreSQL for job data
- Milvus or Pinecone vector DB
- Redis caching for LLM responses
- **Limit**: 10k jobs, 100 req/min

### Phase 2
- Kubernetes deployment
- Auto-scaling based on load
- Live job scraping (LinkedIn/Indeed API)
- **Limit**: 1M jobs, 10k req/min

### Phase 3
- Fine-tuned embeddings model (domain-specific)
- Multi-user authentication + history
- Email notifications
- **Limit**: Enterprise scale


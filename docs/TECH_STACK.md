# Tech Stack Documentation

## 1. Backend

### FastAPI
- **Purpose**: REST API framework, high performance
- **Why**: Built-in async support, OpenAPI auto-documentation, type safety with Pydantic
- **Version**: Latest stable
- **Port**: 8010 (configurable)

### Uvicorn
- **Purpose**: ASGI server for running FastAPI
- **Why**: High performance, supports WebSockets, simple deployment
- **Start command**: `python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010`

### Pydantic
- **Purpose**: Data validation and serialization
- **Why**: Automatic OpenAPI schema generation, type hints

---

## 2. AI / ML Stack

### Embeddings: sentence-transformers
- **Model**: `all-MiniLM-L6-v2`
- **Purpose**: Convert CV and job descriptions to dense vectors (384D)
- **Why**: 
  - Lightweight (22MB) vs large models
  - Fast inference (<100ms)
  - Good semantic understanding for job matching
- **Usage**: 
  - Lazy-loaded on first use (saves startup time)
  - Cached embeddings for jobs in memory

### Vector Database: FAISS
- **Index Type**: IndexFlatL2
- **Purpose**: Store and retrieve job embeddings using cosine/L2 distance
- **Why**:
  - Fast similarity search O(n) with small datasets
  - In-memory, no external DB needed
  - Easy integration with Python
- **Data**: Jobs stored in `backend/data/jobs.json`, loaded at startup
- **Search**: O(n) with n ~10-100 jobs (acceptable for MVP)

### LLM: Google Gemini 2.0 Flash
- **API**: google.generativeai Python client
- **Purpose**: Generate CV analysis (matches, gaps, improvements, advice)
- **Why**:
  - Fast response (2-5 seconds)
  - JSON mode for structured output
  - Free tier available
- **Model Selection**:
  - Primary: `gemini-2.0-flash`
  - Fallback: `gemini-1.5-flash`
  - Dynamic resolution via `_resolve_model_name()` to handle API key limitations
- **JSON Parsing**: Multi-stage decoder
  1. Direct JSON parse
  2. Extract from markdown fenced blocks (```json ... ```)
  3. Streaming character-by-character decode
  4. Fallback to structured error response

---

## 3. File Processing

### PyMuPDF (fitz)
- **Purpose**: Extract text and hyperlinks from PDF files
- **Why**: Fast, lightweight, supports link annotations
- **Features**:
  - Text extraction: page.get_text()
  - Hyperlink detection: page.get_links() → extracts GitHub, LinkedIn URLs
  - Handles scanned PDFs via OCR (if enabled)

### python-docx
- **Purpose**: Extract text from DOCX (Microsoft Word) files
- **Why**: Standard library for .docx parsing
- **Features**: Extracts text from paragraphs, tables

### Regex + Pattern Matching
- **Purpose**: Extract URLs and links from plain text
- **Patterns**:
  - Full URLs: `https?://\S+`
  - GitHub: `github\.com/[\w-]+`
  - LinkedIn: `linkedin\.com/in/[\w-]+`
- **Why**: Catch links that might not be clickable in PDFs

---

## 4. Data Storage

### Job Data (JSON)
- **Location**: `backend/data/jobs.json`
- **Format**:
  ```json
  {
    "jobs": [
      {
        "id": 0,
        "title": "Backend Engineer",
        "description": "...",
        "skills": ["Python", "FastAPI", "PostgreSQL"]
      }
    ]
  }
  ```
- **Why JSON**: Simple, easy to extend, human-readable
- **Limitation**: Not scalable for >10k jobs (upgrade to PostgreSQL for production)

### Uploads
- **Location**: `backend/uploads/`
- **Purpose**: Temporary storage of uploaded CV files
- **Note**: Delete after processing (not needed after analysis)

---

## 5. Environment & Dependencies

### Python
- **Version**: 3.13+
- **Package Manager**: pip
- **Virtual Environment**: venv (included with Python)

### Key Dependencies
```
fastapi==0.109+
uvicorn==0.27+
pydantic==2.5+
pymupdf==1.23+
python-docx==0.8+
sentence-transformers==2.2+
faiss-cpu==1.7+
google-generativeai==0.3+
python-dotenv==1.0+
```

### Environment Variables
```
GEMINI_API_KEY=your_google_api_key
HF_TOKEN=your_huggingface_token (optional)
```

---

## 6. Architecture Decisions

### Why Lazy Loading?
- Embeddings (sentence-transformers) and LLM (Gemini) are initialized on first request
- **Benefit**: API startup <1 second, no cold-start penalties for unused models
- **Tradeoff**: First request ~1-2 seconds slower (tolerable for MVP)

### Why In-Memory FAISS vs External Vector DB?
- **Current**: Jobs loaded into memory, FAISS index rebuilt per deployment
- **Pros**: No external dependencies, fast for small datasets (<10k)
- **Cons**: Can't scale to millions of jobs
- **Next**: Migrate to Pinecone or Milvus when data grows

### Why Multi-Stage JSON Parser?
- LLMs sometimes return partially-formatted JSON (mixed text + code blocks)
- **Solution**: Try multiple parsing strategies, fallback to structured error
- **Benefit**: Robust even with imperfect LLM outputs

### Why Post-Processing?
- LLM outputs can be inconsistent: null values, duplicates, variable formatting
- **Solution**: Separate post-processor module for deterministic cleanup
- **Benefit**: Testable, reusable, easy to extend quality rules

---

## 7. Scaling Roadmap

### MVP (Current)
- In-memory FAISS
- 5-10 seed jobs
- Single-process Uvicorn

### Phase 1 (Next)
- PostgreSQL for job data
- Milvus or Pinecone for embeddings
- Redis cache for LLM responses

### Phase 2
- Docker containerization
- Kubernetes deployment
- Batch job scraping from LinkedIn/Indeed
- Frontend dashboard (React + TailwindCSS)

### Phase 3
- Fine-tuned embedding model for domain
- Multi-user authentication
- Analysis history / saved comparisons
- Email notifications for new matching jobs

### LLM (Large Language Model)

#### Primary

* Google Gemini Flash

#### Backup

* LLaMA 3 (via Groq API)

Purpose:

* Generate explanations
* Identify skill gaps
* Provide improvement suggestions

---

## 5. CV Parsing

* PyMuPDF → PDF extraction
* python-docx → DOCX extraction

---

## 6. Data Sources

Initial:

* Static job dataset (JSON)

Future:

* Job scraping APIs

---

## 7. Optional Enhancements

* Redis → caching
* Celery → background tasks
* Docker → deployment

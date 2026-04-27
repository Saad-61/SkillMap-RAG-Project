# Software Requirements Specification (SRS)

## 1. Functional Requirements

### 1.1 CV Upload & Preview
- User uploads CV file (PDF, DOCX)
- System extracts and previews text (first 500 chars)
- Returns filename and preview for validation before analysis
- **Status**: ✅ Implemented

### 1.2 Text & Link Extraction
- Extract plain text from PDF and DOCX files
- Extract clickable hyperlinks from PDF annotations
- Extract URLs and contact info from text (GitHub, LinkedIn, portfolio)
- Support both with-protocol (https://) and without (github.com/) patterns
- **Status**: ✅ Implemented

### 1.3 RAG-Based Job Retrieval
- Retrieve relevant jobs using semantic similarity (embeddings)
- Score jobs using: cosine distance + skill overlap matching
- Filter out zero-overlap jobs (no matching skills)
- Fallback to top 2 jobs if all filtered out
- Return jobs sorted by score [0-100]
- **Scoring Formula**: `(1/(1+distance)*100) + (skill_overlap*8) - penalty`, clamped [0,100]
- **Status**: ✅ Implemented

### 1.4 Job Matching with Evidence
- Generate match explanation citing specific CV skills
- Identify gaps (what job requires that CV lacks)
- Tie score to evidence, not generic feedback
- Display top matched jobs with explanations
- **Status**: ✅ Implemented

### 1.5 Skill Gap Analysis
- Identify missing skills from matched jobs
- Prioritize skills: HIGH / MEDIUM / LOW
- For each missing skill, recommend:
  - **Option A**: Apply to existing CV project
  - **Option B**: Suggest new practical project
- Provide concrete project implementation (WHAT→WHERE→HOW)
- **Guarantee**: At least one new-project suggestion per analysis
- **Status**: ✅ Implemented

### 1.6 Actionable Improvement Suggestions
- **Project Improvements**: Enhancements to existing projects
  - Format: WHAT feature → WHERE in project → HOW to implement → IMPACT on hiring
  - Example: "Add WebSocket support → FastAPI backend → use native WebSocket class → real-time updates (50ms latency)"
  - Only suggest improvements that strengthen CV for target roles

- **CV Fixes**: Specific updates to resume sections
  - Example: "Add GitHub link to Projects section → improves recruiter discovery"
  - Tied to specific sections: Summary, Skills, Projects, Experience
  - Concrete, not generic ("improve UI" ❌ → "add dark mode via Tailwind" ✅)

- **Top 3 Weekly Actions**: Concrete, deliverable-focused next steps
  - Example: "Deploy one project to Docker → Push working docker-compose.yml to GitHub"
  - Why: "Docker is in 80% of matched backend jobs"
  - Achievable within one week

- **Status**: ✅ Implemented

### 1.7 Confidence Metadata
- Each analysis section labeled with confidence: high / medium / low
- Confidence based on evidence count and specificity
- **Status**: ✅ Implemented

### 1.8 Output Quality Guarantees
- Normalize null values → empty arrays/objects
- Deduplicate fixes and actions by key (no repeated suggestions)
- Add confidence metadata per section
- Guarantee at least one new-project in missing_skills
- Consistent text formatting
- **Status**: ✅ Implemented (via post-processor)

---

## 2. Non-Functional Requirements

### 2.1 Performance
- API response time: <5 seconds per analysis (LLM latency dominates)
- CV text extraction: <500ms per file
- Job embedding retrieval: <100ms
- Startup time: <1 second (lazy loading of models)
- **Status**: ✅ Achieved

### 2.2 Reliability
- Multi-stage JSON parser handles malformed LLM output
- Fallback to structured error response if LLM fails
- Zero crashes on invalid file uploads
- Type-safe responses via Pydantic
- **Status**: ✅ Implemented

### 2.3 Scalability
- MVP: In-memory FAISS with ~10 jobs
- Next phase: PostgreSQL + Milvus for 10k+ jobs
- Horizontal scaling: Stateless API (no session persistence)
- **Status**: ✅ Architecture ready for scale

### 2.4 Security
- Input validation: Only PDF/DOCX files accepted
- File uploads isolated to `backend/uploads/` directory
- No user authentication required (MVP public API)
- Environment variables for API keys (not hardcoded)
- **Status**: ✅ Implemented

### 2.5 Maintainability
- Modular code structure: separate ai/, services/, routes/, utils/ folders
- Type hints throughout (Pydantic models, Python 3.13)
- Clear separation of concerns: analyzer, rag_pipeline, llm, post_processor
- Unit tests for post-processor, analyzer, RAG pipeline (future)
- **Status**: ✅ Code ready for scale

---

## 3. Constraints

### 3.1 Data Limitations
- MVP uses seed job data (backend/data/jobs.json)
- No live scraping from LinkedIn/Indeed yet
- Job data manually curated for MVP
- **Mitigation**: Add automated job scraping in Phase 1

### 3.2 LLM Limitations
- Requires valid GEMINI_API_KEY (Google Gemini API)
- Rate limiting may apply (check Google quota)
- No fine-tuning on domain-specific advice (uses prompt engineering)
- **Mitigation**: Implement caching + prompt optimization in Phase 1

### 3.3 Embedding Model Limitations
- all-MiniLM-L6-v2 is lightweight but less accurate than larger models
- Semantic search may miss domain-specific terminology
- **Mitigation**: Switch to domain-specific model in Phase 2

### 3.4 File Format Support
- Only PDF and DOCX (no DOC, RTF, plain text yet)
- Scanned PDFs may not extract text correctly
- **Mitigation**: Add OCR support and text upload option in Phase 1

---

## 4. Assumptions

- Users upload well-formatted CVs (not scanned images)
- CVs are in English
- Job data is relevant to user's target roles
- Users have valid GEMINI_API_KEY set up
- Matches are based on CV text content (no video/portfolio analysis)
- Analysis quality depends on CV completeness (sparse CVs → less specificity)

---

## 5. Use Cases

### UC1: Analyze CV Against Market
**Actor**: Job seeker  
**Flow**:
1. User uploads CV (PDF/DOCX)
2. System extracts links and text
3. RAG pipeline retrieves matched jobs
4. LLM generates analysis with gaps and improvements
5. User views matched jobs, missing skills, top actions
6. User implements suggestions and re-uploads

**Outcome**: User has concrete, market-based improvement roadmap

### UC2: Find Skill Recommendations
**Actor**: Career coach / hiring manager  
**Flow**:
1. Load candidate CV
2. Review missing_skills section with priorities
3. Recommend specific projects (existing or new)
4. Track progress via top_actions

**Outcome**: Actionable training plan tied to job market

---

## 6. Success Criteria (MVP)

✅ API returns valid JSON with all required fields  
✅ Analysis includes evidence-based explanations  
✅ At least one new-project suggestion per CV  
✅ Links extracted from both PDF and text  
✅ Response time <5 seconds (LLM latency acceptable)  
✅ No crashes on invalid file uploads  
✅ Code modular and testable  
✅ Documentation complete  

---

## 7. Deferred (Phase 2+)

- Frontend dashboard
- User authentication
- Analysis history
- Email notifications
- Live job scraping
- Resume rewriting assistant
- Portfolio optimization
- Multi-language support

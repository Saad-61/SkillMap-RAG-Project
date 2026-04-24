# System Design Document (SDD)

## 1. Architecture Overview

Frontend (React)
        ↓
Backend (FastAPI)
        ↓
AI Layer (RAG Pipeline)
        ↓
Vector DB (FAISS) + PostgreSQL

---

## 2. Components

### 2.1 Frontend
- Upload CV
- Display job matches
- Show insights and suggestions

### 2.2 Backend
- API endpoints
- CV processing
- Job matching logic

### 2.3 AI Layer
- Embeddings generation
- Similarity search
- LLM for explanation

### 2.4 Database
- Users
- Jobs
- Skills

---

## 3. RAG Pipeline

1. Store job postings
2. Convert to embeddings
3. Store in FAISS
4. Convert CV to embedding
5. Retrieve similar jobs
6. Compare + generate insights

---

## 4. Data Flow

User → Upload CV → Backend → Embedding → Retrieve Jobs → Analyze → Return Results
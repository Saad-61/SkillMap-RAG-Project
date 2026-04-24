# AI Job Match & Career Optimizer (RAG-Based)

## 🚀 Overview

An AI-powered system that analyzes a user's CV and matches it with real-world job postings using a Retrieval-Augmented Generation (RAG) pipeline.

The system goes beyond basic resume analysis by providing:

* Job match scoring
* Skill gap analysis
* Actionable improvement suggestions based on real job data

---

## 🎯 Problem Statement

Traditional resume analyzers provide generic feedback and fail to reflect actual job market requirements. Users lack insights into:

* Which jobs they truly qualify for
* Why they are not shortlisted
* What concrete steps they should take to improve

---

## 💡 Solution

This system:

1. Retrieves real job postings
2. Matches them with the user’s CV using embeddings
3. Identifies missing skills and weak areas
4. Generates personalized improvement strategies

---

## 🧠 AI Architecture (RAG)

1. Job postings are converted into embeddings
2. Stored in FAISS vector database
3. User CV is converted into embedding
4. Relevant jobs are retrieved using similarity search
5. LLM generates:

   * Match explanations
   * Skill gap analysis
   * Improvement suggestions

---

## 🛠️ Tech Stack

### Frontend

* React.js
* TailwindCSS
* Axios

### Backend

* FastAPI
* Uvicorn
* Pydantic

### Database

* PostgreSQL (structured data)
* FAISS (vector search)

### AI Stack

* Embeddings: sentence-transformers (all-MiniLM-L6-v2)
* LLM:

  * Primary: Google Gemini Flash
  * Backup: LLaMA 3 (via Groq)

### Parsing

* PyMuPDF
* python-docx

---

## 🧩 Key Features

* CV upload and parsing
* RAG-based job retrieval
* Job match scoring
* Skill gap detection
* Actionable improvement suggestions
* Multi-job insights

---

## 📦 Future Enhancements

* Resume rewriting assistant
* Portfolio optimization suggestions
* Live job scraping
* Caching with Redis

---

## ⚡ Project Goal

To build a real-world AI system that bridges the gap between user skills and job market demands using intelligent retrieval and reasoning.

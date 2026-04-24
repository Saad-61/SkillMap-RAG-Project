# Tech Stack Documentation

## 1. Frontend

* React.js → UI framework
* TailwindCSS → Styling
* Axios → API communication

---

## 2. Backend

* FastAPI → REST API
* Uvicorn → ASGI server
* Pydantic → Data validation

---

## 3. Database

### PostgreSQL

Used for:

* Users
* Job data
* Analysis results

### FAISS (Vector Database)

Used for:

* Storing job embeddings
* Fast similarity search

---

## 4. AI / Machine Learning

### Embedding Model

* sentence-transformers
* Model: all-MiniLM-L6-v2

Purpose:

* Convert text (CV + jobs) into vectors

---

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

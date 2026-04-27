# Setup & Deployment Guide

## Prerequisites

- **Python**: 3.13+ (download from [python.org](https://www.python.org/downloads/))
- **pip**: Comes with Python (verify: `python -m pip --version`)
- **Git**: For version control (optional but recommended)
- **Google Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/)

---

## Local Development Setup

### Step 1: Clone or Create Project

```bash
# Clone (if you have a repo)
git clone <your-repo-url>
cd "RAG project"

# OR: Create fresh directory
mkdir "RAG project"
cd "RAG project"
```

### Step 2: Create Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Verify activation:**
```bash
python --version
# Should show Python 3.13.x
```

### Step 3: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**If requirements.txt is missing:**
```bash
pip install fastapi uvicorn python-multipart pydantic pymupdf python-docx sentence-transformers faiss-cpu python-dotenv google-generativeai
```

**Verify installation:**
```bash
python -c "import fastapi, faiss, sentence_transformers; print('All imports OK!')"
```

### Step 4: Configure Environment Variables

```bash
# Copy example template
cp .env.example .env

# Edit .env (use your favorite editor)
# Windows: notepad .env
# macOS: nano .env
# Linux: vim .env
```

**Add your API keys:**
```
GEMINI_API_KEY=your_google_gemini_api_key_here
HF_TOKEN=your_huggingface_token_here
```

**Get GEMINI_API_KEY:**
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create new API key for your project
4. Copy and paste into .env

### Step 5: Run Backend

```bash
# From backend/ directory
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8010 (Press CTRL+C to quit)
INFO:     Started server process [1234]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**If port 8010 is in use:**
```bash
# Use alternate port
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8011
```

### Step 6: Test API (in a new terminal)

Keep the first terminal running, open a new one:

```bash
# Verify API is running
curl http://127.0.0.1:8010

# Expected: {"message": "CV Analysis API is running"}
```

---

## Testing the Full Workflow

### Upload and Analyze a CV

**Using curl:**
```bash
curl -X POST -F "file=@your_resume.pdf" http://127.0.0.1:8010/cv/upload
```

**Expected response:**
```json
{
  "filename": "your_resume.pdf",
  "preview": "John Doe...[first 500 chars]"
}
```

**Full analysis (the main endpoint):**
```bash
curl -X POST -F "file=@your_resume.pdf" http://127.0.0.1:8010/cv/analyze > analysis.json
cat analysis.json
```

**Using Python:**
```python
import requests

with open("resume.pdf", "rb") as f:
    response = requests.post(
        "http://127.0.0.1:8010/cv/analyze",
        files={"file": f}
    )

print(response.json())
```

---

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**: Install dependencies again
```bash
pip install -r requirements.txt
```

**Verify venv is activated:**
```bash
which python  # macOS/Linux - should show .venv path
where python # Windows - should show .venv path
```

### Issue: `WinError 10013: An attempt was made to access a socket in a way forbidden by its access permissions`

**Solution**: Port 8000 is in use or blocked
```bash
# Use alternate port
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
```

### Issue: `GEMINI_API_KEY not found`

**Solution**: Check .env file
```bash
# Verify .env exists in backend/
ls -la .env

# Check it has the key
cat .env | grep GEMINI_API_KEY
```

**If missing:**
1. Get key from [Google AI Studio](https://aistudio.google.com/)
2. Add to `.env`: `GEMINI_API_KEY=sk-...`

### Issue: API returns `502 Bad Gateway` or `RuntimeError: LLM response not valid JSON`

**Solution**: LLM API issue
1. Verify GEMINI_API_KEY is correct and not expired
2. Check Google quota: [Google AI Studio](https://aistudio.google.com/) → Usage
3. Wait a moment and retry (rate limiting)
4. Check model availability: `python -c "import google.generativeai as genai; genai.configure(api_key='YOUR_KEY'); print([m.name for m in genai.list_models()])"`

### Issue: `File type not supported` error

**Solution**: Only PDF and DOCX are supported
```bash
# OK:
curl -X POST -F "file=@resume.pdf" ...
curl -X POST -F "file=@resume.docx" ...

# NOT OK:
curl -X POST -F "file=@resume.doc" ...    # Old Word format
curl -X POST -F "file=@resume.txt" ...    # Plain text (not yet supported)
```

---

## Project Structure

```
RAG project/
├── .venv/                  # Virtual environment (auto-created)
├── .env                    # API keys (auto-created, GITIGNORE)
├── .git/                   # Git history (if git init)
├── backend/
│   ├── __init__.py
│   ├── main.py             # FastAPI app entry
│   ├── config.py           # Configuration
│   ├── requirements.txt     # Python dependencies
│   ├── ai/
│   │   ├── analyzer.py     # LLM prompt + analysis logic
│   │   ├── llm.py          # Gemini API integration
│   │   ├── rag_pipeline.py # FAISS search + scoring
│   │   ├── embeddings.py   # Embedding lazy loader
│   │   └── vector_store.py
│   ├── routes/
│   │   ├── cv_routes.py    # /cv/upload, /cv/match-jobs, /cv/analyze
│   │   └── __init__.py
│   ├── services/
│   │   ├── cv_parser.py    # PDF/DOCX text extraction
│   │   └── __init__.py
│   ├── models/
│   │   ├── schemas.py      # Pydantic models
│   │   └── __init__.py
│   ├── utils/
│   │   ├── file_handler.py # Save uploaded files
│   │   ├── link_extractor.py # Extract GitHub, LinkedIn URLs
│   │   ├── skill_extractor.py # Extract skills from text
│   │   ├── analysis_postprocess.py # Quality control
│   │   └── __init__.py
│   ├── uploads/            # Temp CV file storage
│   └── data/
│       └── jobs.json       # Job descriptions (seed data)
├── docs/
│   ├── README.md           # Project overview
│   ├── API.md              # Endpoint documentation
│   ├── AI_DESIGN.md        # RAG pipeline & scoring
│   ├── TECH_STACK.md       # Technologies used
│   ├── SRS.md              # Requirements
│   └── SETUP_GUIDE.md      # This file
├── README.md               # Main project README
└── .gitignore              # Git ignore rules
```

---

## Running in Production

### Option 1: Docker (Recommended)

**Create `Dockerfile`:**
```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8010"]
```

**Build and run:**
```bash
docker build -t rag-api .
docker run -p 8010:8010 \
  -e GEMINI_API_KEY=your_key \
  -e HF_TOKEN=your_token \
  rag-api
```

### Option 2: Systemd Service (Linux)

**Create `/etc/systemd/system/rag-api.service`:**
```ini
[Unit]
Description=RAG CV Analysis API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/rag-project/backend
ExecStart=/opt/rag-project/.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8010
Restart=on-failure
Environment="GEMINI_API_KEY=your_key"
Environment="HF_TOKEN=your_token"

[Install]
WantedBy=multi-user.target
```

**Start service:**
```bash
sudo systemctl start rag-api
sudo systemctl enable rag-api
sudo systemctl status rag-api
```

### Option 3: Gunicorn (Production ASGI Server)

```bash
pip install gunicorn

cd backend
gunicorn -w 4 -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8010 \
  main:app
```

### Option 4: Cloud Platforms

**Google Cloud Run:**
```bash
# Create Dockerfile (see Option 1)
gcloud run deploy rag-api \
  --source . \
  --platform managed \
  --memory 512MB \
  --port 8010 \
  --set-env-vars GEMINI_API_KEY=your_key
```

**AWS Lambda + API Gateway:**
- Use Mangum adapter: `pip install mangum`
- Wrap FastAPI app for Lambda: `handler = Mangum(app)`
- Deploy via AWS SAM or Serverless Framework

---

## Monitoring & Logging

### View API Logs

**Local development:**
```bash
# Already visible in terminal where you ran uvicorn
python -m uvicorn main:app --reload --log-level debug
```

**Production (systemd):**
```bash
sudo journalctl -u rag-api -f  # Follow logs
sudo journalctl -u rag-api --since "1 hour ago"  # Last hour
```

### Health Check

```bash
curl http://127.0.0.1:8010
# Response: {"message": "CV Analysis API is running"}
```

### API Docs

**Auto-generated OpenAPI documentation:**
- Swagger UI: http://127.0.0.1:8010/docs
- ReDoc: http://127.0.0.1:8010/redoc

---

## Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `GEMINI_API_KEY` | Yes | `sk-...` | From [Google AI Studio](https://aistudio.google.com/) |
| `HF_TOKEN` | No | `hf_...` | Optional, for future features |
| `LOG_LEVEL` | No | `info` | debug, info, warning, error |
| `PORT` | No | `8010` | HTTP port (default 8010) |
| `HOST` | No | `0.0.0.0` | Bind address (default 127.0.0.1) |

---

## Development Tips

### Hot Reload (Auto-Restart on File Changes)

```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8010
```

When you edit `cv_routes.py`, `analyzer.py`, etc., the server restarts automatically.

### Test Individual Modules

```bash
# Test CV parser
python -c "from services.cv_parser import extract_text_from_file; print(extract_text_from_file('test.pdf'))"

# Test embeddings
python -c "from ai.embeddings import get_embeddings; e = get_embeddings(); print(e.encode('test cv').shape)"

# Test RAG pipeline
python -c "from ai.rag_pipeline import RAGPipeline; rag = RAGPipeline(); print(len(rag.jobs))"
```

### Debug LLM Responses

**Enable debug logging in `backend/ai/analyzer.py`:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Then run:
python main:app --reload
```

### Profile Performance

```bash
pip install py-spy

# Profile the running API
py-spy record -o profile.svg --pid <PID>

# View bottlenecks
```

---

## Next Steps

1. **Test the API**: Upload a sample CV and review analysis
2. **Review Results**: Check `docs/API.md` for response structure
3. **Extend Job Data**: Add more jobs to `backend/data/jobs.json`
4. **Fine-Tune Prompts**: Edit `backend/ai/analyzer.py` to adjust analysis quality
5. **Deploy**: Choose production option (Docker, Cloud Run, etc.)
6. **Build Frontend**: Create React app to consume this API

---

## Support & Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Gemini API**: https://ai.google.dev/
- **FAISS**: https://github.com/facebookresearch/faiss
- **Sentence Transformers**: https://www.sbert.net/


from fastapi import APIRouter, UploadFile, File, HTTPException
from ai.rag_pipeline import RAGPipeline
from services.cv_parser import extract_text_from_file, extract_links_from_file
from utils.file_handler import save_file
from ai.analyzer import analyze_cv

router = APIRouter(prefix="/cv", tags=["CV"])

_rag: RAGPipeline | None = None


def get_rag_pipeline() -> RAGPipeline:
    global _rag
    if _rag is None:
        _rag = RAGPipeline()
    return _rag

@router.post("/upload")
async def upload_cv(file: UploadFile = File(...)):
    file_path = save_file(file)
    text = extract_text_from_file(file_path)

    return {
        "filename": file.filename,
        "preview": text
    }

@router.post("/match-jobs")
async def match_jobs(file: UploadFile = File(...)):
    file_path = save_file(file)
    text = extract_text_from_file(file_path)

    jobs = get_rag_pipeline().retrieve_jobs(text)

    return {
        "matched_jobs": jobs
    }

@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    file_path = save_file(file)
    text = extract_text_from_file(file_path)

    rag_result = get_rag_pipeline().retrieve_jobs_with_scores(text)
    jobs = rag_result["matched_jobs"]
    links = extract_links_from_file(file_path, text)

    try:
        analysis = analyze_cv(text, jobs, links)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "matched_jobs": jobs,
        "links": links,
        "analysis": analysis
    }

from fastapi import APIRouter, UploadFile, File, HTTPException
from ai.rag_pipeline import RAGPipeline
from services.cv_parser import extract_text_from_file
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
        "preview": text[:500]
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

    jobs = get_rag_pipeline().retrieve_jobs(text)

    try:
        analysis = analyze_cv(text, jobs)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "matched_jobs": jobs,
        "analysis": analysis
    }
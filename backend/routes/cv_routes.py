from fastapi import APIRouter, UploadFile, File, HTTPException
from ai.rag_pipeline import RAGPipeline
from ai.rewrite import generate_fix_rewrite
from models.schemas import GenerateFixRequest
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
        "analysis": analysis,
        "cv_text": text,
    }


@router.post("/generate-fix")
async def generate_fix(payload: GenerateFixRequest):
    output_format = (payload.output_format or "").strip().lower()
    if output_format not in {"plain", "latex"}:
        raise HTTPException(status_code=400, detail="output_format must be 'plain' or 'latex'")

    result = generate_fix_rewrite(
        cv_text=payload.cv_text,
        section=payload.fix.section,
        fix=payload.fix.fix,
        why=payload.fix.why,
        how=payload.fix.how,
        output_format=output_format,
    )

    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="Rewrite generation failed")

    if "error" in result:
        raise HTTPException(status_code=502, detail=str(result["error"]))

    return {
        "section": str(result.get("section") or payload.fix.section),
        "format": str(result.get("format") or output_format),
        "rewritten_text": str(result.get("rewritten_text") or "").strip(),
        "notes": str(result.get("notes") or "").strip(),
    }

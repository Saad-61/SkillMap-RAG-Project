from fastapi import APIRouter

router = APIRouter(prefix="/cv", tags=["CV"])

@router.post("/upload")
async def upload_cv():
    return {"message": "CV upload endpoint"}

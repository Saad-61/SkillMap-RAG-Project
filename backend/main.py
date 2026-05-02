from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.cv_routes import router as cv_router
from config import settings

app = FastAPI(title="AI Job Match Backend")

# CORS — origins controlled by FRONTEND_PORT in backend/.env
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include CV routes
app.include_router(cv_router)

@app.get("/")
def root():
    return {
        "message": "Backend is running",
        "backend_port": settings.BACKEND_PORT,
        "allowed_origins": settings.allowed_origins,
    }

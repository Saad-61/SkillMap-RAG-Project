from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.cv_routes import router as cv_router

app = FastAPI(title="AI Job Match Backend")

# CORS for local frontend dev (Vite default port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include CV routes
app.include_router(cv_router)

@app.get("/")
def root():
    return {"message": "Backend is running"}

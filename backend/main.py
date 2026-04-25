from fastapi import FastAPI
from routes.cv_routes import router as cv_router

app = FastAPI(title="AI Job Match Backend")

# Include CV routes
app.include_router(cv_router)

@app.get("/")
def root():
    return {"message": "Backend is running"}
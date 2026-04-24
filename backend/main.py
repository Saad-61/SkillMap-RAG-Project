# Entry point for the FastAPI/Flask application
from fastapi import FastAPI

app = FastAPI(title="CV Parser API")

@app.get("/")
async def root():
    return {"message": "Welcome to the CV Parser API"}

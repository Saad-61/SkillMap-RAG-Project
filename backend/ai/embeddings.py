import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer  # type: ignore[import-not-found]

_model: Optional[SentenceTransformer] = None


def _load_env() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env", override=False)
    load_dotenv(backend_dir.parent / ".env", override=False)


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _load_env()
        token = os.getenv("HF_TOKEN") or None
        _model = SentenceTransformer("all-MiniLM-L6-v2", token=token)
    return _model


def get_embedding(text):
    return _get_model().encode(text)
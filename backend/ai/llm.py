import os
from pathlib import Path
from typing import Optional

import google.generativeai as genai
from dotenv import load_dotenv


def _load_env() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env", override=False)
    load_dotenv(backend_dir.parent / ".env", override=False)


_model: Optional[genai.GenerativeModel] = None


def _resolve_model_name() -> str:
    preferred = os.getenv("GEMINI_MODEL")
    candidates = [
        model
        for model in [
            preferred,
            
            "gemini-2.5-flash",
        ]
        if model
    ]

    available_with_generate = set()
    for model in genai.list_models():
        methods = set(getattr(model, "supported_generation_methods", []) or [])
        if "generateContent" in methods:
            name = (getattr(model, "name", "") or "").split("/", 1)[-1]
            if name:
                available_with_generate.add(name)

    for candidate in candidates:
        if candidate in available_with_generate:
            return candidate

    if available_with_generate:
        return sorted(available_with_generate)[0]

    raise RuntimeError(
        "No Gemini models with generateContent are available for this API key/account"
    )


def _get_model() -> genai.GenerativeModel:
    global _model
    if _model is None:
        _load_env()
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise RuntimeError(
                "Missing GEMINI_API_KEY/GOOGLE_API_KEY in .env or environment"
            )

        genai.configure(api_key=api_key)
        model_name = _resolve_model_name()
        _model = genai.GenerativeModel(model_name)
    return _model

def generate_response(prompt):
    try:
        response = _get_model().generate_content(prompt)
        return response.text
    except Exception as exc:
        raise RuntimeError(f"LLM generation failed: {exc}") from exc
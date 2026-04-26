import os
import json
import re
from pathlib import Path
from typing import Optional

import google.generativeai as genai
from dotenv import load_dotenv


def _load_env() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env", override=False)
    load_dotenv(backend_dir.parent / ".env", override=False)


_model: Optional[genai.GenerativeModel] = None


# ----------------------------
# Model Selection (unchanged)
# ----------------------------
def _resolve_model_name() -> str:
    preferred = os.getenv("GEMINI_MODEL")

    candidates = [
        model
        for model in [
            preferred,
            "gemini-1.5-flash-latest",   #  more stable than 2.5
            "gemini-1.5-flash",
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
        print(f"[LLM] Using model: {model_name}")  # helpful debug

        _model = genai.GenerativeModel(model_name)

    return _model


# ----------------------------
# NEW: JSON Cleaning Logic
# ----------------------------
def _clean_llm_output(text: str) -> str:
    if not text:
        return ""

    # Remove ```json ... ```
    text = re.sub(r"```json", "", text, flags=re.IGNORECASE)
    text = re.sub(r"```", "", text)

    return text.strip()


def _try_parse_json(text: str):
    """Parse JSON from raw/fenced/mixed model output."""
    decoder = json.JSONDecoder()

    # 1) Direct parse first.
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2) Parse fenced code blocks: ```json ... ``` or ``` ... ```.
    fenced_blocks = re.findall(r"```(?:json)?\s*([\s\S]*?)```", text, flags=re.IGNORECASE)
    for block in fenced_blocks:
        candidate = block.strip()
        try:
            return json.loads(candidate)
        except Exception:
            continue

    # 3) Parse first decodable JSON object/array found in mixed text.
    for i, ch in enumerate(text):
        if ch not in "[{":
            continue
        try:
            parsed, _ = decoder.raw_decode(text[i:])
            return parsed
        except Exception:
            continue

    raise ValueError("No valid JSON found in model output")


# ----------------------------
# MAIN FUNCTION
# ----------------------------
def generate_response(prompt: str):
    text = ""

    try:
        response = _get_model().generate_content(prompt)

        # safer extraction
        text = getattr(response, "text", "") or ""

        if not text:
            # fallback if text is empty
            try:
                text = response.candidates[0].content.parts[0].text
            except Exception:
                pass

        cleaned = _clean_llm_output(text)

        try:
            return _try_parse_json(cleaned)
        except Exception:
            pass

        # Final fallback
        return {
            "error": "LLM output parsing failed",
            "raw": text
        }

    except Exception as e:
        return {
            "error": f"LLM generation failed: {str(e)}",
            "raw": text
        }
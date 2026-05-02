import os
import json
import re
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv
import requests


def _load_env() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env", override=False)
    load_dotenv(backend_dir.parent / ".env", override=False)


_models: dict[str, genai.GenerativeModel] = {}


def _log_llm_event(request_source: str, message: str) -> None:
    print(f"[LLM][{request_source}] {message}")


def _groq_api_key() -> str:
    _load_env()
    return os.getenv("GROQ_API_KEY", "").strip()


def _groq_candidate_model_names() -> list[str]:
    preferred = os.getenv("GROQ_MODEL")
    candidates = [
        preferred,
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
    ]
    return [model for model in candidates if model]


def _generate_with_groq(prompt: str, model_name: str) -> str:
    api_key = _groq_api_key()
    if not api_key:
        raise RuntimeError("Missing GROQ_API_KEY in .env or environment")

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model_name,
            "messages": [
                {"role": "system", "content": "Return strict JSON only. Do not wrap the answer in markdown fences."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        },
        timeout=90,
    )
    response.raise_for_status()
    payload = response.json()

    try:
        return str(payload["choices"][0]["message"]["content"] or "")
    except Exception as exc:
        raise RuntimeError(f"Groq response parsing failed: {exc}") from exc

def _candidate_model_names() -> list[str]:
    preferred = os.getenv("GEMINI_MODEL")

    configured_candidates = [
        model
        for model in [
            preferred,
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash-001",
            "gemini-2.0-flash-lite",
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

    candidates = [
        candidate for candidate in configured_candidates if candidate in available_with_generate
    ]

    if candidates:
        return candidates

    if available_with_generate:
        return sorted(available_with_generate)

    raise RuntimeError(
        "No Gemini models with generateContent are available for this API key/account"
    )


def _provider_order() -> list[str]:
    configured = os.getenv("LLM_PROVIDER_ORDER", "gemini,groq")
    order = [provider.strip().lower() for provider in configured.split(",") if provider.strip()]
    if not order:
        return ["gemini", "groq"]

    deduped: list[str] = []
    for provider in order:
        if provider not in deduped:
            deduped.append(provider)
    return deduped


def _configure_genai() -> None:
    _load_env()
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise RuntimeError(
            "Missing GEMINI_API_KEY/GOOGLE_API_KEY in .env or environment"
        )

    genai.configure(api_key=api_key)


def _get_model(model_name: str) -> genai.GenerativeModel:
    if model_name not in _models:
        print(f"[LLM] Using model: {model_name}")
        _models[model_name] = genai.GenerativeModel(model_name)
    return _models[model_name]


def _is_fallback_worthy_error(exc: Exception) -> bool:
    message = str(exc).lower()
    fallback_markers = [
        "429",
        "quota",
        "rate limit",
        "resource exhausted",
        "temporarily unavailable",
        "503",
        "500",
        "deadline exceeded",
        "timed out",
        "unavailable",
    ]
    return any(marker in message for marker in fallback_markers)


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
def generate_response(prompt: str, request_source: str = "unknown"):
    text = ""
    errors: list[str] = []

    for provider in _provider_order():
        if provider == "gemini":
            try:
                _configure_genai()
                candidates = _candidate_model_names()
            except Exception as exc:
                errors.append(f"gemini: {str(exc)}")
                _log_llm_event(request_source, f"Skipping gemini provider: {exc}")
                continue

            for model_name in candidates:
                try:
                    _log_llm_event(request_source, f"Trying gemini model {model_name}")
                    response = _get_model(model_name).generate_content(prompt)

                    text = getattr(response, "text", "") or ""

                    if not text:
                        try:
                            text = response.candidates[0].content.parts[0].text
                        except Exception:
                            pass

                    cleaned = _clean_llm_output(text)

                    try:
                        parsed = _try_parse_json(cleaned)
                        _log_llm_event(request_source, f"Using gemini model {model_name}")
                        return parsed
                    except Exception:
                        pass

                    _log_llm_event(request_source, f"Using gemini model {model_name} but JSON parse failed")
                    return {
                        "error": "LLM output parsing failed",
                        "raw": text,
                        "model": model_name,
                        "provider": "gemini",
                    }
                except Exception as exc:
                    errors.append(f"gemini:{model_name}: {str(exc)}")
                    if _is_fallback_worthy_error(exc):
                        _log_llm_event(request_source, f"Falling back after gemini {model_name} error: {exc}")
                        continue

                    return {
                        "error": f"LLM generation failed on gemini {model_name}: {str(exc)}",
                        "raw": text,
                        "provider": "gemini",
                    }

        elif provider == "groq":
            groq_key = _groq_api_key()
            if not groq_key:
                errors.append("groq: Missing GROQ_API_KEY")
                _log_llm_event(request_source, "Skipping groq provider: missing GROQ_API_KEY")
                continue

            for model_name in _groq_candidate_model_names():
                try:
                    _log_llm_event(request_source, f"Trying groq model {model_name}")
                    text = _generate_with_groq(prompt, model_name)
                    cleaned = _clean_llm_output(text)

                    try:
                        parsed = _try_parse_json(cleaned)
                        _log_llm_event(request_source, f"Using groq model {model_name}")
                        return parsed
                    except Exception:
                        pass

                    _log_llm_event(request_source, f"Using groq model {model_name} but JSON parse failed")
                    return {
                        "error": "LLM output parsing failed",
                        "raw": text,
                        "model": model_name,
                        "provider": "groq",
                    }
                except Exception as exc:
                    errors.append(f"groq:{model_name}: {str(exc)}")
                    if _is_fallback_worthy_error(exc):
                        _log_llm_event(request_source, f"Falling back after groq {model_name} error: {exc}")
                        continue

                    return {
                        "error": f"LLM generation failed on groq {model_name}: {str(exc)}",
                        "raw": text,
                        "provider": "groq",
                    }

    return {
        "error": "LLM generation failed on all candidate models: " + " | ".join(errors),
        "raw": text,
    }

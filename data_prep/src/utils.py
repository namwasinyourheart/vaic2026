import json
import time
import openai
from pathlib import Path
from config import (
    OPENROUTER_API_KEY, LLM_MODEL, LLM_BASE_URL,
    LLM_TEMPERATURE, LLM_MAX_TOKENS,
    RETRY_ATTEMPTS, RETRY_DELAY, REQUEST_DELAY, OUTPUT_DIR,
)

_client = None


def get_llm_client() -> openai.OpenAI:
    global _client
    if _client is None:
        _client = openai.OpenAI(
            api_key=OPENROUTER_API_KEY,
            base_url=LLM_BASE_URL,
        )
    return _client


def call_llm(system_prompt: str, user_prompt: str, temperature: float | None = None) -> str:
    client = get_llm_client()
    temp = temperature if temperature is not None else LLM_TEMPERATURE

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            resp = client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temp,
                max_tokens=LLM_MAX_TOKENS,
            )
            time.sleep(REQUEST_DELAY)
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if attempt < RETRY_ATTEMPTS:
                print(f"  [Retry {attempt}/{RETRY_ATTEMPTS}] {e}")
                time.sleep(RETRY_DELAY * attempt)
            else:
                raise RuntimeError(f"LLM call failed after {RETRY_ATTEMPTS} attempts: {e}")


def save_json(data, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Saved: {path}")


def load_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def ensure_dirs():
    for d in [
        OUTPUT_DIR,
        OUTPUT_DIR / "documents",
        OUTPUT_DIR / "metadata",
        OUTPUT_DIR / "graph",
        OUTPUT_DIR / "benchmark",
        OUTPUT_DIR / "ground_truth",
    ]:
        d.mkdir(parents=True, exist_ok=True)

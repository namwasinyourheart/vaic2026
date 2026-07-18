from __future__ import annotations
import time
import openai
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from config import OPENROUTER_API_KEY, LLM_MODEL, LLM_BASE_URL, LLM_TEMPERATURE, LLM_MAX_TOKENS, RETRY_ATTEMPTS, RETRY_DELAY, REQUEST_DELAY

_client = None


def get_client() -> openai.OpenAI:
    global _client
    if _client is None:
        _client = openai.OpenAI(api_key=OPENROUTER_API_KEY, base_url=LLM_BASE_URL)
    return _client


def generate(
    system_prompt: str,
    user_prompt: str,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> str:
    client = get_client()
    temp = temperature if temperature is not None else LLM_TEMPERATURE
    tokens = max_tokens if max_tokens is not None else LLM_MAX_TOKENS

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            resp = client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temp,
                max_tokens=tokens,
            )
            time.sleep(REQUEST_DELAY)
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if attempt < RETRY_ATTEMPTS:
                print(f"  [LLM retry {attempt}/{RETRY_ATTEMPTS}] {e}")
                time.sleep(RETRY_DELAY * attempt)
            else:
                raise RuntimeError(f"LLM failed after {RETRY_ATTEMPTS} attempts: {e}")

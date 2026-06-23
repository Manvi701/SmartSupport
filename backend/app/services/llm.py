import json
import logging
from typing import Dict, Any, Optional
from openai import OpenAI
from app.config import settings

logger = logging.getLogger("gateway_triage")

class LLMService:
    def __init__(self):
        self.client = None
        if not settings.MOCK_AI_MODE and settings.OPENAI_API_KEY:
            try:
                self.client = OpenAI(
                    api_key=settings.OPENAI_API_KEY,
                    base_url=settings.OPENAI_API_BASE
                )
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")

    def generate_json(self, system_prompt: str, user_prompt: str, response_schema: Optional[type] = None) -> Dict[str, Any]:
        """
        Calls the LLM API to get structured JSON output.
        If mock mode is active, or if API call fails, it returns None, triggering the local heuristic fallback.
        """
        if settings.MOCK_AI_MODE or not self.client:
            return None

        try:
            kwargs = {
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.1,
            }

            # If response_schema is provided (Pydantic model) and supported by provider, use it
            if response_schema:
                try:
                    # Support structured outputs
                    kwargs["response_format"] = {
                        "type": "json_schema",
                        "json_schema": {
                            "name": response_schema.__name__,
                            "strict": True,
                            "schema": response_schema.model_json_schema()
                        }
                    }
                except Exception:
                    # Fallback to general JSON object
                    kwargs["response_format"] = {"type": "json_object"}
            else:
                kwargs["response_format"] = {"type": "json_object"}

            response = self.client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            logger.error(f"LLM API Call failed: {e}. Falling back to rule-based heuristics.")
            return None

llm_service = LLMService()

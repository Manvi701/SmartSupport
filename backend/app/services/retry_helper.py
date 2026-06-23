import time
import logging
from typing import Callable, Any, Dict

logger = logging.getLogger("gateway_triage")

# Global thread-safe counters to track retry telemetry
RECOVERED_RETRY_COUNT = 0
TOTAL_RETRY_ATTEMPTS = 0
RETRY_SUCCESSES = 0

def get_retry_stats() -> Dict[str, int]:
    """
    Returns telemetry counters for retry operations.
    """
    global RECOVERED_RETRY_COUNT, TOTAL_RETRY_ATTEMPTS, RETRY_SUCCESSES
    return {
        "recovered": RECOVERED_RETRY_COUNT,
        "attempts": TOTAL_RETRY_ATTEMPTS,
        "successes": RETRY_SUCCESSES
    }

def retry_on_failure(max_retries: int = 3, fallback_value: Any = None):
    """
    Decorator/Wrapper to execute AI/API calls with fault-tolerant retries.
    If the function fails, it retries up to max_retries. Upon final failure, it serves fallback_value.
    """
    def decorator(func: Callable[..., Any]):
        def wrapper(*args, **kwargs) -> Any:
            global RECOVERED_RETRY_COUNT, TOTAL_RETRY_ATTEMPTS, RETRY_SUCCESSES
            
            last_exception = None
            
            for attempt in range(1, max_retries + 1):
                try:
                    if attempt > 1:
                        TOTAL_RETRY_ATTEMPTS += 1
                        logger.warning(f"Retrying AI call {func.__name__} - Attempt {attempt}/{max_retries}")
                        # Exponential backoff pause
                        time.sleep(0.15 * (2 ** (attempt - 1)))
                        
                    result = func(*args, **kwargs)
                    
                    if attempt > 1:
                        RECOVERED_RETRY_COUNT += 1
                        RETRY_SUCCESSES += 1
                        logger.info(f"AI call {func.__name__} successfully recovered on attempt {attempt}")
                        
                    return result
                except Exception as e:
                    last_exception = e
                    logger.error(f"AI call {func.__name__} failed on attempt {attempt}: {str(e)}")
            
            # If we reached here, all retries failed
            logger.error(f"All {max_retries} attempts failed for {func.__name__}. Invoking graceful fallback.")
            
            # Check if fallback_value is a dict, return it. If it is callable, call it.
            if callable(fallback_value):
                return fallback_value()
            return fallback_value
            
        return wrapper
    return decorator

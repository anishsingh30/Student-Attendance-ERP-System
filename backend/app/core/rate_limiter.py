import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status
from app.core.config import settings

class InMemoryRateLimiter:
    """
    Sliding window in-memory rate limiter.
    Stores timestamps of requests per client key (IP address or authenticated user ID).
    """
    def __init__(self):
        # key -> list of timestamps
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def check(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        window_start = now - window_seconds

        # Prune outdated timestamps
        self.requests[key] = [ts for ts in self.requests[key] if ts > window_start]

        if len(self.requests[key]) >= max_requests:
            return False

        self.requests[key].append(now)
        return True

    def get_retry_after(self, key: str, window_seconds: int) -> int:
        now = time.time()
        if not self.requests[key]:
            return 1
        oldest_relevant = self.requests[key][0]
        retry_after = int(window_seconds - (now - oldest_relevant)) + 1
        return max(1, retry_after)

    def reset(self):
        self.requests.clear()

limiter = InMemoryRateLimiter()

def rate_limit(max_requests: int = 20, window_seconds: int = 60, endpoint_tag: str = "default"):
    """
    FastAPI dependency that enforces rate limits.
    Key is composed of endpoint_tag + client IP.
    """
    async def dependency(request: Request):
        if not settings.AUTH_RATE_LIMIT_ENABLED:
            return True

        # Extract client IP (or X-Forwarded-For if behind a proxy)
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        key = f"{endpoint_tag}:{client_ip}"

        if not limiter.check(key, max_requests=max_requests, window_seconds=window_seconds):
            retry_after = limiter.get_retry_after(key, window_seconds=window_seconds)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for this endpoint. Please retry in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )
        return True

    return dependency


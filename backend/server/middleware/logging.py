"""
Structured JSON Request Logging & Timing Middleware.
Assigns X-Request-ID and tracks millisecond latency without logging secrets.
"""
import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("fintech.api")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Req:%(name)s] %(message)s"
)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = request_id
        start_time = time.perf_counter()
        
        try:
            response: Response = await call_next(request)
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            logger.error(f"REQUEST_FAILED | id={request_id} | {request.method} {request.url.path} | {latency_ms:.2f}ms | error={str(e)}")
            raise e
        
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = f"{latency_ms:.2f}ms"
        
        if request.url.path not in ("/health", "/"):
            logger.info(f"HTTP_{response.status_code} | id={request_id} | {request.method} {request.url.path} | {latency_ms:.2f}ms")
        
        return response

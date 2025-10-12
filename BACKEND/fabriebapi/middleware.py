import time
import logging

logger = logging.getLogger(__name__)

class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.time()
        path = request.path
        method = request.method

        logger.info(f"➡️ {method} {path} started")

        try:
            response = self.get_response(request)
        except Exception as e:
            logger.error(f"❌ Error handling {method} {path}: {e}")
            raise

        duration = (time.time() - start) * 1000
        logger.info(f"✅ {method} {path} finished in {duration:.2f} ms with status {response.status_code}")

        return response
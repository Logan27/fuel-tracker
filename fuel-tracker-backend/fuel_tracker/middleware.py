"""
Middleware for request tracking and centralized logging.
"""
import uuid
import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class CorrelationIdMiddleware(MiddlewareMixin):
    """
    Middleware for adding correlation_id to each request.
    
    Correlation ID allows tracking one request through all logs
    in distributed system.
    
    Usage:
    - Generates unique UUID for each request
    - Adds correlation_id to response header (X-Correlation-ID)
    - Adds correlation_id to local logging context
    """
    
    def process_request(self, request):
        """
        Generate correlation_id for incoming request.
        """
        # Use existing correlation_id from header or generate new one
        correlation_id = request.headers.get('X-Correlation-ID', str(uuid.uuid4()))
        
        # Save in request for use in views
        request.correlation_id = correlation_id
        
        # Save request processing start time
        request.start_time = time.time()
        
        return None
    
    def process_response(self, request, response):
        """
        Add correlation_id to response headers.
        """
        if hasattr(request, 'correlation_id'):
            response['X-Correlation-ID'] = request.correlation_id
            
            # Calculate request processing time
            if hasattr(request, 'start_time'):
                duration = time.time() - request.start_time
                response['X-Response-Time'] = f"{duration:.3f}s"
        
        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware for logging all HTTP requests.
    
    Logs:
    - Request method and path
    - Response status code
    - Processing time
    - Correlation ID
    - User ID (if authenticated)
    """
    
    def process_request(self, request):
        """
        Log incoming request.
        Note: Request body is not logged to protect sensitive data (passwords, tokens).
        """
        correlation_id = getattr(request, 'correlation_id', 'N/A')
        user_id = request.user.id if request.user.is_authenticated else 'anonymous'

        # Debug: log sessionid cookie presence
        has_sessionid = 'sessionid' in request.COOKIES
        sessionid_value = request.COOKIES.get('sessionid', '')[:10] if has_sessionid else 'N/A'

        logger.info(
            f"[{correlation_id}] Request: {request.method} {request.path} | User: {user_id} | "
            f"Session: {sessionid_value}{'...' if has_sessionid else ''}"
        )

        return None
    
    def process_response(self, request, response):
        """
        Log request response.
        """
        correlation_id = getattr(request, 'correlation_id', 'N/A')
        user_id = request.user.id if request.user.is_authenticated else 'anonymous'
        duration = time.time() - request.start_time if hasattr(request, 'start_time') else 0
        
        # Determine logging level by status
        if response.status_code >= 500:
            log_level = logging.ERROR
        elif response.status_code >= 400:
            log_level = logging.WARNING
        else:
            log_level = logging.INFO
        
        logger.log(
            log_level,
            f"[{correlation_id}] Response: {request.method} {request.path} | "
            f"Status: {response.status_code} | Duration: {duration:.3f}s | User: {user_id}"
        )
        
        return response
    
    def process_exception(self, request, exception):
        """
        Log unhandled exceptions.
        """
        correlation_id = getattr(request, 'correlation_id', 'N/A')
        user_id = request.user.id if request.user.is_authenticated else 'anonymous'
        
        logger.exception(
            f"[{correlation_id}] Exception: {request.method} {request.path} | "
            f"User: {user_id} | Error: {str(exception)}"
        )
        
        return None


class SecurityEventMiddleware(MiddlewareMixin):
    """
    Middleware for logging security events.
    
    Events:
    - Failed sign in attempts (401/403)
    - Attempts to access other users data
    - Suspicious activity
    """
    
    def process_response(self, request, response):
        """
        Log security events based on response status.
        """
        correlation_id = getattr(request, 'correlation_id', 'N/A')
        
        # Log failed authentication/authorization attempts
        if response.status_code in [401, 403]:
            user_id = request.user.id if request.user.is_authenticated else 'anonymous'
            ip_address = self._get_client_ip(request)
            
            logger.warning(
                f"[SECURITY] [{correlation_id}] Access denied | "
                f"Status: {response.status_code} | "
                f"Method: {request.method} | "
                f"Path: {request.path} | "
                f"User: {user_id} | "
                f"IP: {ip_address}"
            )
        
        return response
    
    def _get_client_ip(self, request):
        """
        Extract client IP address from request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


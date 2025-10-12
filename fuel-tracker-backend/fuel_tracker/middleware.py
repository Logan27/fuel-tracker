"""
Middleware для трекинга запросов и централизованного логирования.
"""
import uuid
import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class CorrelationIdMiddleware(MiddlewareMixin):
    """
    Middleware для добавления correlation_id к каждому запросу.
    
    Correlation ID позволяет отслеживать один запрос через все логи
    в распределённой системе.
    
    Использование:
    - Генерирует уникальный UUID для каждого запроса
    - Добавляет correlation_id в заголовок ответа (X-Correlation-ID)
    - Добавляет correlation_id в локальный контекст логирования
    """
    
    def process_request(self, request):
        """
        Генерирует correlation_id для входящего запроса.
        """
        # Используем existing correlation_id из заголовка или генерируем новый
        correlation_id = request.headers.get('X-Correlation-ID', str(uuid.uuid4()))
        
        # Сохраняем в request для использования в views
        request.correlation_id = correlation_id
        
        # Сохраняем время начала обработки запроса
        request.start_time = time.time()
        
        return None
    
    def process_response(self, request, response):
        """
        Добавляет correlation_id в заголовки ответа.
        """
        if hasattr(request, 'correlation_id'):
            response['X-Correlation-ID'] = request.correlation_id
            
            # Вычисляем время обработки запроса
            if hasattr(request, 'start_time'):
                duration = time.time() - request.start_time
                response['X-Response-Time'] = f"{duration:.3f}s"
        
        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware для логирования всех HTTP запросов.
    
    Логирует:
    - Метод и путь запроса
    - Статус код ответа
    - Время обработки
    - Correlation ID
    - User ID (если авторизован)
    """
    
    def process_request(self, request):
        """
        Логирует входящий запрос.
        Note: Request body не логируется для защиты sensitive data (passwords, tokens).
        """
        correlation_id = getattr(request, 'correlation_id', 'N/A')
        user_id = request.user.id if request.user.is_authenticated else 'anonymous'
        
        logger.info(
            f"[{correlation_id}] Request: {request.method} {request.path} | User: {user_id}"
        )
        
        return None
    
    def process_response(self, request, response):
        """
        Логирует ответ на запрос.
        """
        correlation_id = getattr(request, 'correlation_id', 'N/A')
        user_id = request.user.id if request.user.is_authenticated else 'anonymous'
        duration = time.time() - request.start_time if hasattr(request, 'start_time') else 0
        
        # Определяем уровень логирования по статусу
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
        Логирует необработанные исключения.
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
    Middleware для логирования событий безопасности.
    
    События:
    - Неудачные попытки входа (401/403)
    - Попытки доступа к чужим данным
    - Подозрительная активность
    """
    
    def process_response(self, request, response):
        """
        Логирует события безопасности на основе статуса ответа.
        """
        correlation_id = getattr(request, 'correlation_id', 'N/A')
        
        # Логируем неудачные попытки аутентификации/авторизации
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
        Извлекает IP адрес клиента из запроса.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


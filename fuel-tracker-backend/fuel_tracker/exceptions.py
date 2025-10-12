"""
Кастомный обработчик исключений для DRF.

Обеспечивает единообразный формат ответов для всех ошибок.
"""
import logging
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework import status
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Кастомный обработчик исключений для стандартизированного формата ответов.
    
    Формат ответа:
    {
        "errors": [
            {
                "status": "400",
                "code": "validation_error",
                "detail": "Описание ошибки"
            }
        ]
    }
    
    Args:
        exc: Исключение
        context: Контекст запроса
    
    Returns:
        Response с стандартизированным форматом ошибки
    """
    # Получаем стандартный ответ от DRF
    response = drf_exception_handler(exc, context)
    
    # Извлекаем correlation_id из request (если есть)
    request = context.get('request')
    correlation_id = getattr(request, 'correlation_id', 'N/A') if request else 'N/A'
    
    # Если DRF обработал исключение
    if response is not None:
        # Логируем ошибку
        logger.error(
            f"[{correlation_id}] Exception handled: {exc.__class__.__name__} | "
            f"Status: {response.status_code} | "
            f"Detail: {str(exc)}"
        )
        
        # Преобразуем в стандартный формат
        standardized_response = standardize_error_response(
            response.status_code,
            response.data,
            exc
        )
        
        response.data = standardized_response
        return response
    
    # Обработка Django исключений, которые DRF не обработал
    if isinstance(exc, Http404):
        logger.error(f"[{correlation_id}] 404 Not Found: {str(exc)}")
        return create_error_response(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code='not_found',
            detail='Resource not found'
        )
    
    if isinstance(exc, PermissionDenied):
        logger.error(f"[{correlation_id}] 403 Permission Denied: {str(exc)}")
        return create_error_response(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code='permission_denied',
            detail='You do not have permission to perform this action'
        )
    
    if isinstance(exc, DjangoValidationError):
        logger.error(f"[{correlation_id}] Django Validation Error: {str(exc)}")
        return create_error_response(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code='validation_error',
            detail=str(exc)
        )
    
    # Необработанные исключения (500)
    logger.exception(
        f"[{correlation_id}] Unhandled exception: {exc.__class__.__name__} | "
        f"Detail: {str(exc)}"
    )
    
    # В production не раскрываем детали внутренних ошибок
    from django.conf import settings
    if settings.DEBUG:
        detail = f"{exc.__class__.__name__}: {str(exc)}"
    else:
        detail = "An internal server error occurred. Please try again later."
    
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code='internal_server_error',
        detail=detail
    )


def standardize_error_response(status_code, data, exc):
    """
    Преобразует ответ DRF в стандартизированный формат.
    
    Args:
        status_code: HTTP статус код
        data: Данные ошибки от DRF
        exc: Исключение
    
    Returns:
        dict: Стандартизированный формат ошибки
    """
    errors = []
    
    # Определяем error_code на основе типа исключения
    error_code = get_error_code(exc)
    
    # Обрабатываем различные форматы данных от DRF
    if isinstance(data, dict):
        # Если есть поле detail - это простая ошибка
        if 'detail' in data:
            errors.append({
                'status': str(status_code),
                'code': error_code,
                'detail': data['detail']
            })
        # Иначе это ошибки валидации полей
        else:
            for field, messages in data.items():
                if isinstance(messages, list):
                    for message in messages:
                        errors.append({
                            'status': str(status_code),
                            'code': error_code,
                            'detail': f"{field}: {message}" if field != 'non_field_errors' else message,
                            'field': field if field != 'non_field_errors' else None
                        })
                else:
                    errors.append({
                        'status': str(status_code),
                        'code': error_code,
                        'detail': f"{field}: {messages}",
                        'field': field
                    })
    elif isinstance(data, list):
        for item in data:
            errors.append({
                'status': str(status_code),
                'code': error_code,
                'detail': str(item)
            })
    else:
        errors.append({
            'status': str(status_code),
            'code': error_code,
            'detail': str(data)
        })
    
    return {'errors': errors}


def create_error_response(status_code, error_code, detail):
    """
    Создаёт Response с стандартизированным форматом ошибки.
    
    Args:
        status_code: HTTP статус код
        error_code: Машиночитаемый код ошибки
        detail: Человекочитаемое описание
    
    Returns:
        Response с форматированной ошибкой
    """
    from rest_framework.response import Response
    
    return Response(
        {
            'errors': [{
                'status': str(status_code),
                'code': error_code,
                'detail': detail
            }]
        },
        status=status_code
    )


def get_error_code(exc):
    """
    Определяет машиночитаемый код ошибки на основе типа исключения.
    
    Args:
        exc: Исключение
    
    Returns:
        str: Код ошибки
    """
    from rest_framework.exceptions import (
        ValidationError, AuthenticationFailed, NotAuthenticated,
        PermissionDenied as DRFPermissionDenied, NotFound,
        MethodNotAllowed, NotAcceptable, UnsupportedMediaType,
        Throttled, ParseError
    )
    
    error_code_map = {
        ValidationError: 'validation_error',
        AuthenticationFailed: 'authentication_failed',
        NotAuthenticated: 'not_authenticated',
        DRFPermissionDenied: 'permission_denied',
        NotFound: 'not_found',
        MethodNotAllowed: 'method_not_allowed',
        NotAcceptable: 'not_acceptable',
        UnsupportedMediaType: 'unsupported_media_type',
        Throttled: 'throttled',
        ParseError: 'parse_error',
    }
    
    return error_code_map.get(type(exc), 'error')


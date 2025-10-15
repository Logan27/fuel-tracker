"""
Custom exception handler for DRF.

Provides consistent response format for all errors.
"""
import logging
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework import status
from django.core.exceptions import PermissionDenied, ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for standardized response format.
    
    Response format:
    {
        "errors": [
            {
                "status": "400",
                "code": "validation_error",
                "detail": "Error description"
            }
        ]
    }
    
    Args:
        exc: Exception
        context: Request context
        
        Returns:
        Response with standardized error format
    """
    # Get standard response from DRF
    response = drf_exception_handler(exc, context)
    
    # Extract correlation_id from request (if exists)
    request = context.get('request')
    correlation_id = getattr(request, 'correlation_id', 'N/A') if request else 'N/A'
    
    # If DRF handled exception
    if response is not None:
        # Log error
        logger.error(
            f"[{correlation_id}] Exception handled: {exc.__class__.__name__} | "
            f"Status: {response.status_code} | "
            f"Detail: {str(exc)}"
        )
        
        # Convert to standard format
        standardized_response = standardize_error_response(
            response.status_code,
            response.data,
            exc
        )
        
        response.data = standardized_response
        return response
    
    # Handle Django exceptions that DRF did not handle
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
    
    # Unhandled exceptions (500)
    logger.exception(
        f"[{correlation_id}] Unhandled exception: {exc.__class__.__name__} | "
        f"Detail: {str(exc)}"
    )
    
    # In production do not reveal internal error details
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
    Convert DRF response to standardized format.
    
    Args:
        status_code: HTTP status code
        data: Error data from DRF
        exc: Exception
    
    Returns:
        dict: Standardized error format
    """
    errors = []
    
    # Determine error_code based on exception type
    error_code = get_error_code(exc)
    
    # Handle different data formats from DRF
    if isinstance(data, dict):
        # If there is detail field - this is simple error
        if 'detail' in data:
            errors.append({
                'status': str(status_code),
                'code': error_code,
                'detail': data['detail']
            })
        # Otherwise these are field validation errors
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
    Create Response with standardized error format.
    
    Args:
        status_code: HTTP status code
        error_code: Machine-readable error code
        detail: Human-readable description
    
    Returns:
        Response with formatted error
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
    Determine machine-readable error code based on exception type.
    
    Args:
        exc: Exception
    
    Returns:
        str: Error code
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


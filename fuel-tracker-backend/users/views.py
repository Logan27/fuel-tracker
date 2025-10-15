import csv
import logging
from io import StringIO
from datetime import timedelta
from django.contrib.auth import login, logout
from django.http import HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import UserCreateSerializer, LoginSerializer, UserSerializer, UserSignUpResponseSerializer, UserUpdateSerializer
from .utils import get_locale_from_request
from .models import User

logger = logging.getLogger(__name__)


class AuthenticationThrottle(AnonRateThrottle):
    """
    Custom throttle for authentication endpoints
    Limits to 5 requests per minute to prevent brute force attacks
    """
    scope = 'auth'


@extend_schema(
    summary="Sign up",
    description="Register a new user account with email and password. User is automatically logged in after successful registration. "
                "Rate limited to 5 requests per minute to prevent abuse. Requires CSRF token.",
    tags=['Authentication'],
    request=UserCreateSerializer,
    responses={
        201: UserSignUpResponseSerializer,
        400: OpenApiResponse(description="Validation error (e.g., email already exists, weak password)"),
        429: OpenApiResponse(description="Too many requests - rate limit exceeded"),
    },
)
class SignUpView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserCreateSerializer
    throttle_classes = [AuthenticationThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Determine locale (currency and timezone) from browser headers
        currency, timezone = get_locale_from_request(request)
        user.preferred_currency = currency
        user.timezone = timezone
        user.save()
        
        logger.info(f"New user registered: {user.email}, locale: {currency}, {timezone}")

        # Explicitly specify which backend was used for authentication
        # This is necessary since we have multiple backends
        user.backend = 'users.backends.EmailBackend'
        login(request, user)
        return Response(UserSignUpResponseSerializer(user).data, status=status.HTTP_201_CREATED)

@extend_schema(
    summary="Sign in",
    description="Authenticate user with email and password. Returns user profile and creates a session. "
                "Rate limited to 5 requests per minute to prevent brute force attacks. Requires CSRF token.",
    tags=['Authentication'],
    request=LoginSerializer,
    responses={
        200: UserSerializer,
        401: OpenApiResponse(description="Invalid credentials"),
        429: OpenApiResponse(description="Too many requests - rate limit exceeded"),
    },
)
class SignInView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    throttle_classes = [AuthenticationThrottle]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # Check account lockout before validation
        try:
            user = User.objects.get(email=email)
            
            # If account is locked
            if user.locked_until and user.locked_until > timezone.now():
                remaining_minutes = int((user.locked_until - timezone.now()).total_seconds() / 60)
                logger.warning(
                    f"[SECURITY] Locked account login attempt: {email} | "
                    f"IP: {self.get_client_ip(request)} | "
                    f"Remaining: {remaining_minutes} minutes"
                )
                return Response({
                    'errors': [{
                        'status': '429',
                        'code': 'account_locked',
                        'detail': f'Account temporarily locked. Try again in {remaining_minutes} minutes.'
                    }]
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        except User.DoesNotExist:
            pass  # Continue to normal validation
        
        # Validation credentials
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Successful login - reset failed attempts
            user.failed_login_attempts = 0
            user.locked_until = None
            user.save(update_fields=['failed_login_attempts', 'locked_until'])
            
            logger.info(f"Successful login: {user.email}")
            
            # Explicitly specify which backend was used for authentication
            user.backend = 'users.backends.EmailBackend'
            login(request, user)
            return Response(UserSerializer(user).data)
        
        else:
            # Failed attempt - increment failed attempts
            try:
                user = User.objects.get(email=email)
                user.failed_login_attempts += 1
                
                # Lock after 5 failed attempts for 15 minutes
                if user.failed_login_attempts >= 5:
                    user.locked_until = timezone.now() + timedelta(minutes=15)
                    logger.warning(
                        f"[SECURITY] Account locked after 5 failed attempts: {email} | "
                        f"IP: {self.get_client_ip(request)}"
                    )
                
                user.save(update_fields=['failed_login_attempts', 'locked_until'])
                
                logger.warning(
                    f"[SECURITY] Failed login attempt ({user.failed_login_attempts}/5): {email} | "
                    f"IP: {self.get_client_ip(request)}"
                )
            
            except User.DoesNotExist:
                # Do not reveal email existence
                logger.warning(
                    f"[SECURITY] Login attempt for non-existent user: {email} | "
                    f"IP: {self.get_client_ip(request)}"
                )
            
            return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

@extend_schema(
    summary="Sign out",
    description="Log out the current user and terminate the session. Requires CSRF token.",
    tags=['Authentication'],
    request=None,
    responses={
        204: OpenApiResponse(description="Successfully logged out"),
    },
)
class SignOutView(APIView):
    def post(self, request, *args, **kwargs):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)

@extend_schema(
    summary="Get or update user profile",
    description="Retrieve or update the profile of the authenticated user. Use PATCH for partial updates.",
    tags=['Users'],
    responses={
        200: UserSerializer,
    },
)
class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/v1/users/me - get current user profile
    PATCH /api/v1/users/me - update current user profile
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserSerializer


@extend_schema(
    summary="Export user data (GDPR)",
    description="Export all user data in CSV format. Includes user profile, vehicles, and fuel entries. "
                "This endpoint complies with GDPR data portability requirements.",
    tags=['Users'],
    responses={
        200: OpenApiResponse(
            description="CSV file with all user data",
            response={'type': 'string', 'format': 'binary'},
        ),
    },
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_user_data(request):
    """
    GDPR: Export all user data in CSV format.
    
    Returns CSV file with all data:
    - User profile
    - Vehicles
    - Fuel entries
    """
    user = request.user
    
    logger.info(f"User {user.id} ({user.email}) requested data export")
    
    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)
    
    # Section 1: User profile
    writer.writerow(['=== USER PROFILE ==='])
    writer.writerow(['Field', 'Value'])
    writer.writerow(['ID', user.id])
    writer.writerow(['email', user.email])
    writer.writerow(['Username', user.username])
    writer.writerow(['Display Name', user.display_name])
    writer.writerow(['First Name', user.first_name])
    writer.writerow(['Last Name', user.last_name])
    writer.writerow(['Preferred Currency', user.preferred_currency])
    writer.writerow(['Preferred Distance Unit', user.preferred_distance_unit])
    writer.writerow(['Preferred Volume Unit', user.preferred_volume_unit])
    writer.writerow(['Timezone', user.timezone])
    writer.writerow(['Date Joined', user.date_joined])
    writer.writerow(['Last Login', user.last_login])
    writer.writerow([])
    
    # Section 2: Vehicles
    writer.writerow(['=== VEHICLES ==='])
    vehicles = user.vehicles.all()
    if vehicles.exists():
        writer.writerow(['ID', 'Name', 'Make', 'Model', 'Year', 'Fuel Type', 'Is Active', 'Created At', 'Updated At'])
        for vehicle in vehicles:
            writer.writerow([
                vehicle.id,
                vehicle.name,
                vehicle.make,
                vehicle.model,
                vehicle.year,
                vehicle.fuel_type,
                vehicle.is_active,
                vehicle.created_at,
                vehicle.updated_at
            ])
    else:
        writer.writerow(['No vehicles'])
    writer.writerow([])
    
    # Section 3: Fuel entries
    writer.writerow(['=== FUEL ENTRIES ==='])
    fuel_entries = user.fuel_entries.select_related('vehicle').order_by('-entry_date')
    if fuel_entries.exists():
        writer.writerow([
            'ID', 'Vehicle Name', 'Date', 'Odometer (km)', 'Station', 'Brand', 'Grade',
            'Liters', 'Total Amount', 'Unit Price', 'Distance Since Last (km)',
            'Consumption (L/100km)', 'Cost per km', 'Notes', 'Created At', 'Updated At'
        ])
        for entry in fuel_entries:
            writer.writerow([
                entry.id,
                entry.vehicle.name,
                entry.entry_date,
                entry.odometer,
                entry.station_name,
                entry.fuel_brand,
                entry.fuel_grade,
                entry.liters,
                entry.total_amount,
                entry.unit_price,
                entry.distance_since_last,
                entry.consumption_l_100km,
                entry.cost_per_km,
                entry.notes,
                entry.created_at,
                entry.updated_at
            ])
    else:
        writer.writerow(['No fuel entries'])
    
    # Prepare response
    csv_data = output.getvalue()
    output.close()
    
    response = HttpResponse(csv_data, content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="fuel_tracker_export_{user.id}.csv"'
    
    logger.info(f"Data export completed for user {user.id}")
    
    return response


@extend_schema(
    summary="Delete user account (GDPR)",
    description="Permanently delete the user account and all associated data (vehicles, fuel entries). "
                "This action cannot be undone. session is terminated after deletion. "
                "Complies with GDPR right to erasure.",
    tags=['Users'],
    request=None,
    responses={
        204: OpenApiResponse(description="Account successfully deleted"),
    },
)
@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
@transaction.atomic
def delete_user_account(request):
    """
    GDPR: Irreversible deletion of user account and all related data.
    
    Deletes:
    - All fuel entries
    - All vehicles
    - User profile
    
    Session is terminated after deletion.
    """
    user = request.user
    user_id = user.id
    user_email = user.email
    
    logger.warning(f"User {user_id} ({user_email}) requested account deletion")
    
    # Count what will be deleted (for logs)
    vehicles_count = user.vehicles.count()
    fuel_entries_count = user.fuel_entries.count()
    
    # Delete user (cascade deletion will remove vehicles and fuel_entries)
    user.delete()
    
    # Terminate session
    logout(request)
    
    logger.warning(
        f"Account deleted: user_id={user_id}, email={user_email}, "
        f"vehicles={vehicles_count}, fuel_entries={fuel_entries_count}"
    )
    
    return Response(status=status.HTTP_204_NO_CONTENT)
from django.urls import path
from .views import SignUpView, SignInView, SignOutView, UserProfileView, export_user_data, delete_user_account

urlpatterns = [
    path('signup', SignUpView.as_view(), name='signup'),
    path('signin', SignInView.as_view(), name='signin'),
    path('signout', SignOutView.as_view(), name='signout'),
    path('me', UserProfileView.as_view(), name='user-profile'),
    path('me/export', export_user_data, name='user-export'),
    path('me/delete', delete_user_account, name='user-delete'),
]

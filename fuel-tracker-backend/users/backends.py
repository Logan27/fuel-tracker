from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.hashers import make_password

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        try:
            # Email comes in username field since we use it for sign in
            user = UserModel.objects.get(email=username)
        except UserModel.DoesNotExist:
            # Protection against timing attack: perform dummy hash operation
            # so response time is same for existing/non-existing emails
            make_password(password)
            return None

        if user.check_password(password):
            return user
        return None

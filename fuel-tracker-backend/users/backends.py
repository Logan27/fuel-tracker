from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.hashers import make_password

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        try:
            # В поле username приходит email, так как мы используем его для входа
            user = UserModel.objects.get(email=username)
        except UserModel.DoesNotExist:
            # Защита от timing attack: выполняем фиктивную hash операцию
            # чтобы время ответа было одинаковым для существующих/несуществующих email
            make_password(password)
            return None

        if user.check_password(password):
            return user
        return None

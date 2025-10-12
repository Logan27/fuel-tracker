from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    price_precision = serializers.IntegerField(required=False, min_value=2, max_value=3)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'display_name', 'preferred_currency', 'preferred_distance_unit', 'preferred_volume_unit', 'timezone', 'price_precision')
        read_only_fields = ('id', 'username', 'email')

class UserUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления профиля пользователя (PATCH)"""
    display_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    price_precision = serializers.IntegerField(required=False, min_value=2, max_value=3)
    
    class Meta:
        model = User
        fields = ('display_name', 'preferred_currency', 'preferred_distance_unit', 'preferred_volume_unit', 'timezone', 'price_precision')
        # Все поля опциональны при обновлении

class UserSignUpResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email')

class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def validate_email(self, value):
        """
        Проверка уникальности email.
        Сообщение об ошибке не раскрывает существование email (anti-enumeration).
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "If this email is not already registered, you will receive a confirmation email."
            )
        return value

    def validate(self, data):
        # Применяем стандартные валидаторы Django к паролю
        password = data.get('password')
        validate_password(password)
        return super().validate(data)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # EmailBackend ожидает username (а не email) как параметр
        user = authenticate(username=data.get('email'), password=data.get('password'))
        if user and user.is_active:
            return {'user': user}
        raise serializers.ValidationError("Incorrect Credentials")

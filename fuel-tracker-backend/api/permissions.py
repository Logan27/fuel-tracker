from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Кастомный permission: доступ только владельцу объекта.
    Проверяет, что obj.user == request.user
    """

    def has_object_permission(self, request, view, obj):
        """
        Проверка на уровне объекта: пользователь может получить доступ
        только к своим собственным объектам (Vehicle, FuelEntry)
        """
        return obj.user == request.user


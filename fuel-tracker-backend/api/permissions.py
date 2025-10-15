from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Custom permission: access only to the owner of the object.
    Checks that obj.user == request.user
    """

    def has_object_permission(self, request, view, obj):
        """
        Object-level check: user can only access their own objects (Vehicle, FuelEntry)
        """
        return obj.user == request.user


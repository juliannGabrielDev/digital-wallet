from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Contact

User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    """
    Serializer para devolver la información del usuario
    después de autenticarse.
    """
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        read_only_fields = ('id',)

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer para el registro de nuevos usuarios.
    """
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para incluir información del usuario
    en la respuesta del login.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Agregamos la información del usuario
        data['user'] = CustomUserSerializer(self.user).data
        
        return data


class ContactSerializer(serializers.ModelSerializer):
    """
    Serializer para listar y crear los contactos guardados por un usuario.
    """
    contact_user = CustomUserSerializer(read_only=True)
    contact_user_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Contact
        fields = ('id', 'alias', 'created_at', 'contact_user', 'contact_user_id')
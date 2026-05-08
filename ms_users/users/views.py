from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import Contact
from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    ContactSerializer,
)
from .events import publish_user_created

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """
    Endpoint RestFul para el registro de usuarios.
    Permite a cualquier usuario crear una cuenta.
    """
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        # 1. Guardamos el usuario en la DB de ms_users
        user = serializer.save()

        # 2. Disparamos el evento asíncrono a RabbitMQ
        try:
            publish_user_created(user.id, user.email)
        except Exception as e:
            print(f"Error enviando a RabbitMQ: {e}")
            # Nota: En prod, aquí usarías una tarea de reintento

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Vista personalizada para el login que devuelve
    los tokens y la información del usuario.
    """
    serializer_class = CustomTokenObtainPairSerializer


class MyContactListView(generics.ListAPIView):
    """
    Lista la libreta de contactos del usuario autenticado.
    """
    serializer_class = ContactSerializer

    def get_queryset(self):
        return Contact.objects.filter(owner=self.request.user).select_related('contact_user')


class UserContactListView(generics.ListAPIView):
    """
    Lista los contactos de un usuario específico.
    Solo el mismo usuario (o staff) puede consultar su libreta.
    """
    serializer_class = ContactSerializer

    def get_queryset(self):
        requested_user_id = str(self.kwargs['user_id'])
        current_user_id = str(self.request.user.id)

        if requested_user_id != current_user_id and not self.request.user.is_staff:
            raise PermissionDenied('No tienes permisos para ver esta libreta de contactos.')

        return Contact.objects.filter(owner_id=requested_user_id).select_related('contact_user')


from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer
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

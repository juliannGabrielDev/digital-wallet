import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """
    Modelo de usuario personalizado.
    Usa UUID como llave primaria para evitar colisiones entre bases de datos.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # El framework ya incluye campos como:
    # username, email, password, is_staff, is_active, etc.

    def __str__(self):
        return self.username

class Contact(models.Model):
    """
    Representa la libreta de direcciones de un usuario.
    """
    # El dueño de la libreta de contactos
    owner = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='contact_list'
    )
    # El usuario al que estamos guardando (el destino)
    contact_user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='contacted_by'
    )
    # El apodo que le ponemos (ej. "Juan de la Universidad")
    alias = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Evita que guardes a la misma persona dos veces
        unique_together = ('owner', 'contact_user')

    def __str__(self):
        return f"{self.owner.username} -> {self.alias}"

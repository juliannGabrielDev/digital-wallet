import uuid
from django.db import models

class Wallet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Aquí guardamos el UUID que viene de ms_users. NO es un ForeignKey.
    user_id = models.UUIDField(unique=True, help_text="UUID del usuario proveniente de ms_users")
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True, help_text="Estado de la tarjeta/cuenta")
    created_at = models.DateTimeField(auto_now_add=True)

    def get_balance(self):
        """Obtener la cantidad que el usuario tiene en su cuenta."""
        return self.balance

    def deactivate_card(self):
        """Función para poder desactivar la tarjeta."""
        self.is_active = False
        self.save()

    def activate_card(self):
        """Función para poder activar la tarjeta."""
        self.is_active = True
        self.save()

    def __str__(self):
        return f"Wallet {self.id} - Saldo: ${self.balance}"

class Transaction(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('COMPLETED', 'Completada'),
        ('FAILED', 'Fallida'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey('Wallet', on_delete=models.PROTECT, related_name='sent_transactions')
    receiver = models.ForeignKey('Wallet', on_delete=models.PROTECT, related_name='received_transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.user_id} -> {self.receiver.user_id} : ${self.amount}"
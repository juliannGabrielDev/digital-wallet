
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from .models import Wallet, Transaction

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def make_transfer(request):
    """
    Endpoint para realizar transferencias.
    Requiere un Body JSON: {"receiver_user_id": "UUID", "amount": "50.00"}
    """
    # El usuario origen lo sacamos del Token JWT por seguridad
    sender_user_id = request.user.id  
    receiver_user_id = request.data.get('receiver_user_id')
    amount = Decimal(request.data.get('amount', '0.00'))

    if amount <= 0:
        return Response(
            {'error': 'El monto debe ser mayor a 0'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if str(sender_user_id) == str(receiver_user_id):
        return Response({"error": "No puedes enviarte dinero a ti mismo"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            # select_for_update() bloquea las filas en PostgreSQL para evitar Race Conditions
            sender_wallet = Wallet.objects.select_for_update().get(user_id=sender_user_id)
            receiver_wallet = Wallet.objects.select_for_update().get(user_id=receiver_user_id)

            # Validar que las tarjetas estén activas
            if not sender_wallet.is_active:
                return Response({"error": "Tu tarjeta está desactivada, no puedes realizar transferencias"}, status=status.HTTP_400_BAD_REQUEST)
            
            if not receiver_wallet.is_active:
                return Response({"error": "La cuenta destino no está disponible"}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Validar fondos
            if sender_wallet.balance < amount:
                return Response({"error": "Fondos insuficientes"}, status=status.HTTP_400_BAD_REQUEST)

            # 2. Mover el dinero
            sender_wallet.balance -= amount
            receiver_wallet.balance += amount
            
            sender_wallet.save()
            receiver_wallet.save()

            # 3. Registrar la transacción
            tx = Transaction.objects.create(
                sender=sender_wallet,
                receiver=receiver_wallet,
                amount=amount,
                status='COMPLETED'
            )

            # TODO: RabbitMQ - Emitir evento 'TransferenciaCompletada' para ms_notifications
            # events.publish_transfer_event(tx.id)

        return Response({"message": "Transferencia exitosa", "tx_id": tx.id}, status=status.HTTP_200_OK)
    except Wallet.DoesNotExist:
        return Response({"error": "Wallet no encontrada"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance(request):
    print('HEADERS:', request.headers)
    print('AUTH:', request.headers.get('Authorization'))
    """
    Endpoint para obtener el saldo de la cuenta/tarjeta.
    """
    user_id = request.user.id
    try:
        wallet = Wallet.objects.get(user_id=user_id)
        return Response({
            "balance": wallet.get_balance(),
            "is_active": wallet.is_active
        }, status=status.HTTP_200_OK)
    except Wallet.DoesNotExist:
        return Response({"error": "Wallet no encontrada"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deactivate_card(request):
    """
    Endpoint para desactivar la cuenta/tarjeta.
    """
    user_id = request.user.id
    try:
        wallet = Wallet.objects.get(user_id=user_id)
        if not wallet.is_active:
            return Response({"message": "La tarjeta ya está desactivada"}, status=status.HTTP_400_BAD_REQUEST)
        
        wallet.deactivate_card()
        return Response({"message": "Tarjeta desactivada exitosamente"}, status=status.HTTP_200_OK)
    except Wallet.DoesNotExist:
        return Response({"error": "Wallet no encontrada"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_card(request):
    """
    Endpoint para activar la cuenta/tarjeta.
    """
    user_id = request.user.id
    try:
        wallet = Wallet.objects.get(user_id=user_id)
        if wallet.is_active:
            return Response({"message": "La tarjeta ya está activada"}, status=status.HTTP_400_BAD_REQUEST)
        
        wallet.activate_card()
        return Response({"message": "Tarjeta activada exitosamente"}, status=status.HTTP_200_OK)
    except Wallet.DoesNotExist:
        return Response({"error": "Wallet no encontrada"}, status=status.HTTP_404_NOT_FOUND)
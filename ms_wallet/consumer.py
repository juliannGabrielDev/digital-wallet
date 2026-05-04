import pika
import json
import os
import django

# 1. Configuración de Django para que el script pueda usar los modelos
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from wallets.models import Wallet

def create_wallet_callback(ch, method, properties, body):
    """
    Función que se ejecuta cada vez que llega un mensaje a la cola.
    """
    data = json.loads(body)
    user_id = data.get('user_id')
    email = data.get('email')

    print(f" [v] Recibido evento: Crear billetera para {email}")

    try:
        # 2. Lógica de negocio: Crear la billetera en la DB de ms_wallet
        # Usamos get_or_create para evitar duplicados si el mensaje se reenvía
        wallet, created = Wallet.objects.get_or_create(
            user_id=user_id,
            defaults={'balance': 0.00}
        )
        
        if created:
            print(f" [OK] Billetera creada exitosamente para UUID: {user_id}")
        else:
            print(f" [!] El usuario {user_id} ya tenía una billetera.")

        # 3. Confirmamos a RabbitMQ que procesamos el mensaje correctamente
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f" [X] Error procesando billetera: {e}")
        # En caso de error, no enviamos el ACK para que RabbitMQ lo reintente luego

def main():
    # Conexión al contenedor de RabbitMQ
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq'))
    channel = connection.channel()

    # Declaramos la cola (debe coincidir con la de ms_users)
    channel.queue_declare(queue='user_created_queue', durable=True)

    # Configuramos para que no envíe más de un mensaje a la vez a este consumidor
    channel.basic_qos(prefetch_count=1)
    
    channel.basic_consume(queue='user_created_queue', on_message_callback=create_wallet_callback)

    print(' [*] ms_wallet escuchando eventos de RabbitMQ. Para salir presiona CTRL+C')
    channel.start_consuming()

if __name__ == '__main__':
    main()
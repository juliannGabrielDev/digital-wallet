import os
import pika
import json

def publish_user_created(user_id, email):
    # Tomamos la URL del docker-compose (o localhost si estás probando por fuera)
    rabbitmq_url = os.environ.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672/')

    # Conexión profesional usando la URL completa
    parameters = pika.URLParameters(rabbitmq_url)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()

    # Declaramos la cola por si no existe
    channel.queue_declare(queue='user_created_queue', durable=True)

    message = {
        'user_id': str(user_id),
        'email': email,
        'action': 'create_wallet'
    }

    # Enviamos el JSON con el UUID del usuario
    channel.basic_publish(
        exchange='',
        routing_key='user_created_queue',
        body=json.dumps(message),
        properties=pika.BasicProperties(delivery_mode=2) # Mensaje persistente
    )

    print(f" [x] Evento enviado a RabbitMQ: Usuario {user_id} creado")
    connection.close()
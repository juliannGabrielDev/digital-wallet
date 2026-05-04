import pika
import json

def publish_user_created(user_id, email):
    # Conexión al contenedor de RabbitMQ definido en docker-compose
    connection = pika.BlockingConnection(pika.ConnectionParameters(host='rabbitmq'))
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
    
    print(f" [x] Evento enviado: Usuario {user_id} creado")
    connection.close()
package events

import (
	"context"
	"encoding/json"
	"log"
	"ms_wallet/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	amqp "github.com/rabbitmq/amqp091-go"
)

type UserCreatedEvent struct {
	UserID string `json:"user_id"`
}

type RabbitMQConsumer struct {
	conn *amqp.Connection
	repo *repository.Queries
}

func NewRabbitMQConsumer(url string, repo *repository.Queries) (*RabbitMQConsumer, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}
	return &RabbitMQConsumer{conn: conn, repo: repo}, nil
}

func (c *RabbitMQConsumer) Close() {
	c.conn.Close()
}

// StartListening inicia la suscripción a la cola de RabbitMQ
func (c *RabbitMQConsumer) StartListening() error {
	ch, err := c.conn.Channel()
	if err != nil {
		return err
	}

	// Declaramos la cola para asegurarnos de que exista
	q, err := ch.QueueDeclare(
		"user_created_queue", // Nombre de la cola
		true,                 // Durable (sobrevive a reinicios)
		false,                // Auto-delete
		false,                // Exclusiva
		false,                // No-wait
		nil,                  // Argumentos
	)
	if err != nil {
		return err
	}

	msgs, err := ch.Consume(
		q.Name,
		"ms_wallet_consumer", // Consumer ID
		false,                // Auto-ack (lo haremos manual por seguridad)
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	log.Println("[ms_wallet] Consumidor RabbitMQ activo. Esperando eventos de usuarios...")

	// Goroutine que escucha mensajes infinitamente
	go func() {
		for d := range msgs {
			var event UserCreatedEvent
			if err := json.Unmarshal(d.Body, &event); err != nil {
				log.Printf("Error decodificando mensaje: %s", err)
				d.Nack(false, false) // Rechazar mensaje malformado
				continue
			}

			log.Printf("Evento recibido: Crear billetera para el usuario %s", event.UserID)

			// Transformar strings a los tipos que exige sqlc y pgx
			walletID := uuid.New()
			userUUID, err := uuid.Parse(event.UserID)
			if err != nil {
				log.Printf("ID de usuario inválido: %v", err)
				d.Nack(false, false)
				continue
			}

			_, err = c.repo.CreateWallet(context.Background(), repository.CreateWalletParams{
				ID:       pgtype.UUID{Bytes: walletID, Valid: true},
				UserID:   pgtype.UUID{Bytes: userUUID, Valid: true},
				Balance:  pgtype.Numeric{Int: nil, Valid: true}, // Balance inicial 0
				Currency: "MXN",
			})

			if err != nil {
				log.Printf("Error creando billetera en DB: %v", err)
				// Si la base de datos falla, devolvemos el mensaje a la cola para reintentar luego
				d.Nack(false, true)
			} else {
				log.Printf("¡Billetera creada exitosamente para %s!", event.UserID)
				d.Ack(false) // Confirmar que procesamos el mensaje exitosamente
			}
		}
	}()

	return nil
}

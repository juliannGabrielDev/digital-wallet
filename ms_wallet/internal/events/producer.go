package events

import (
	"context"
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type TransactionCompletedEvent struct {
	TransactionID  int32   `json:"transaction_id"`
	SenderUserID   string  `json:"sender_user_id"`
	ReceiverUserID string  `json:"receiver_user_id"`
	Amount         string  `json:"amount"` // Usamos string para no perder precisión en JSON
	Currency       string  `json:"currency"`
	Description    string  `json:"description"`
}

type RabbitMQProducer struct {
	conn *amqp.Connection
}

func NewRabbitMQProducer(url string) (*RabbitMQProducer, error) {
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, err
	}
	return &RabbitMQProducer{conn: conn}, nil
}

func (p *RabbitMQProducer) Close() {
	if p.conn != nil {
		p.conn.Close()
	}
}

func (p *RabbitMQProducer) PublishTransactionEvent(ctx context.Context, event TransactionCompletedEvent) error {
	ch, err := p.conn.Channel()
	if err != nil {
		return err
	}
	defer ch.Close()

	// Declarar el exchange explícitamente (tipo fanout o direct)
	err = ch.ExchangeDeclare(
		"transactions_exchange", // name
		"direct",                // type
		true,                    // durable
		false,                   // auto-deleted
		false,                   // internal
		false,                   // no-wait
		nil,                     // arguments
	)
	if err != nil {
		return err
	}

	nestPayload := map[string]interface{}{
		"pattern": "transaction.completed",
		"data":    event,
	}
	body, err := json.Marshal(nestPayload)
	if err != nil {
		return err
	}

	err = ch.PublishWithContext(ctx,
		"transactions_exchange", // exchange
		"transaction.completed", // routing key
		false,                   // mandatory
		false,                   // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})
	
	if err != nil {
		log.Printf("[ms_wallet] Error publicando evento: %v", err)
		return err
	}
	
	log.Printf("[ms_wallet] Evento transaction.completed publicado para transacción ID %d", event.TransactionID)
	return nil
}

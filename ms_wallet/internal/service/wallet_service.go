package service

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"

	"ms_wallet/internal/events"
	"ms_wallet/internal/repository"
)

type TransferRequest struct {
	FromUserID  uuid.UUID
	ToUserID    uuid.UUID
	Amount      decimal.Decimal
	Currency    string
	Description string
}

type WalletService struct {
	db       *pgxpool.Pool
	repo     *repository.Queries
	producer *events.RabbitMQProducer
}

func NewWalletService(db *pgxpool.Pool, repo *repository.Queries, producer *events.RabbitMQProducer) *WalletService {
	return &WalletService{
		db:       db,
		repo:     repo,
		producer: producer,
	}
}

func (s *WalletService) TransferMoney(ctx context.Context, req TransferRequest) (*repository.Transaction, error) {
	if req.Amount.LessThanOrEqual(decimal.Zero) {
		return nil, errors.New("el monto debe ser mayor a cero")
	}

	// 1. Aquí haríamos la llamada gRPC a ms_users para validar al usuario destino.
	// Asumiremos por ahora que ms_users valida al usuario y procedemos con la transacción.

	// Iniciar transacción en Postgres
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("error iniciando transacción: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.repo.WithTx(tx)

	// Transformar UUIDs de Go a pgtype.UUID
	fromPgUUID := pgtype.UUID{Bytes: req.FromUserID, Valid: true}
	toPgUUID := pgtype.UUID{Bytes: req.ToUserID, Valid: true}

	// Obtener Wallets originales para verificar la moneda y la existencia
	senderWallet, err := qtx.GetWallet(ctx, fromPgUUID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener cartera origen: %w", err)
	}

	receiverWallet, err := qtx.GetWallet(ctx, toPgUUID)
	if err != nil {
		return nil, fmt.Errorf("error al obtener cartera destino: %w", err)
	}

	// Bloquear filas de forma determinista para evitar Deadlocks
	var firstWalletID, secondWalletID pgtype.UUID
	if senderWallet.ID.Bytes[0] < receiverWallet.ID.Bytes[0] {
		firstWalletID, secondWalletID = senderWallet.ID, receiverWallet.ID
	} else {
		firstWalletID, secondWalletID = receiverWallet.ID, senderWallet.ID
	}

	_, err = qtx.GetWalletForUpdate(ctx, firstWalletID)
	if err != nil {
		return nil, fmt.Errorf("error bloqueando primera billetera: %w", err)
	}
	_, err = qtx.GetWalletForUpdate(ctx, secondWalletID)
	if err != nil {
		return nil, fmt.Errorf("error bloqueando segunda billetera: %w", err)
	}

	// Validar fondos del emisor (convertimos pgtype.Numeric a decimal para operarlo)
	var senderBalance decimal.Decimal
	if senderWallet.Balance.Valid {
		val, _ := senderWallet.Balance.Value()
		strVal := fmt.Sprintf("%v", val)
		senderBalance, _ = decimal.NewFromString(strVal)
	}

	if senderBalance.LessThan(req.Amount) {
		return nil, errors.New("fondos insuficientes")
	}

	// Preparar montos
	var negAmountPg, posAmountPg pgtype.Numeric
	negAmountPg.Scan(req.Amount.Neg().String())
	posAmountPg.Scan(req.Amount.String())

	// Realizar débitos y créditos
	_, err = qtx.UpdateWalletBalance(ctx, repository.UpdateWalletBalanceParams{
		ID:     senderWallet.ID,
		Amount: negAmountPg,
	})
	if err != nil {
		return nil, fmt.Errorf("error debitando fondos: %w", err)
	}

	_, err = qtx.UpdateWalletBalance(ctx, repository.UpdateWalletBalanceParams{
		ID:     receiverWallet.ID,
		Amount: posAmountPg,
	})
	if err != nil {
		return nil, fmt.Errorf("error acreditando fondos: %w", err)
	}

	var transactionAmountPg pgtype.Numeric
	transactionAmountPg.Scan(req.Amount.String())

	// Registrar transacción
	transaction, err := qtx.CreateTransaction(ctx, repository.CreateTransactionParams{
		FromWalletID: senderWallet.ID,
		ToWalletID:   receiverWallet.ID,
		Amount:       transactionAmountPg,
		Status:       "COMPLETED",
		Currency:     req.Currency,
		Description:  req.Description,
	})
	if err != nil {
		return nil, fmt.Errorf("error registrando transacción: %w", err)
	}

	// Confirmar transacción local
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("error confirmando transacción: %w", err)
	}

	// Publicar evento de transacción completada en RabbitMQ
	go func() {
		if s.producer != nil {
			event := events.TransactionCompletedEvent{
				TransactionID:  transaction.ID,
				SenderUserID:   req.FromUserID.String(),
				ReceiverUserID: req.ToUserID.String(),
				Amount:         req.Amount.String(),
				Currency:       req.Currency,
				Description:    req.Description,
			}
			err := s.producer.PublishTransactionEvent(context.Background(), event)
			if err != nil {
				log.Printf("[ms_wallet] Aviso: No se pudo publicar evento de transacción %d: %v", transaction.ID, err)
			}
		}
	}()

	return &transaction, nil
}

func (s *WalletService) GetWallet(ctx context.Context, userID uuid.UUID) (*repository.Wallet, error) {
	pgUUID := pgtype.UUID{Bytes: userID, Valid: true}
	
	wallet, err := s.repo.GetWallet(ctx, pgUUID)
	if err != nil {
		return nil, fmt.Errorf("billetera no encontrada para el usuario")
	}

	return &wallet, nil
}

// SetActiveStatus activa o desactiva la billetera de un usuario
func (s *WalletService) SetActiveStatus(ctx context.Context, userID uuid.UUID, isActive bool) (*repository.Wallet, error) {
	pgUUID := pgtype.UUID{Bytes: userID, Valid: true}
	
	wallet, err := s.repo.UpdateWalletActiveStatus(ctx, repository.UpdateWalletActiveStatusParams{
		UserID:   pgUUID,
		IsActive: isActive,
	})
	if err != nil {
		return nil, fmt.Errorf("error al cambiar estado de la billetera: %w", err)
	}

	return &wallet, nil
}

// GetTransactions obtiene el historial de transacciones de una billetera
func (s *WalletService) GetTransactions(ctx context.Context, userID uuid.UUID, limit int32, offset int32) ([]repository.Transaction, error) {
	// Primero obtenemos la billetera del usuario
	wallet, err := s.GetWallet(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Consultamos las transacciones
	transactions, err := s.repo.GetTransactionsByWallet(ctx, repository.GetTransactionsByWalletParams{
		FromWalletID: wallet.ID,
		Limit:        limit,
		Offset:       offset,
	})
	if err != nil {
		return nil, fmt.Errorf("error obteniendo transacciones: %w", err)
	}

	return transactions, nil
}

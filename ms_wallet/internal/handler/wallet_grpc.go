package handler

import (
	"context"
	"math"
	"math/big"
	"ms_wallet/internal/grpc/pb"
	"ms_wallet/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type WalletGRPCServer struct {
	pb.UnimplementedWalletServiceServer
	repo *repository.Queries
}

func NewWalletGRPCServer(repo *repository.Queries) *WalletGRPCServer {
	return &WalletGRPCServer{repo: repo}
}

func (s *WalletGRPCServer) GetWallet(ctx context.Context, req *pb.WalletRequest) (*pb.WalletResponse, error) {
	userUUID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, err
	}
	userID := pgtype.UUID{Bytes: userUUID, Valid: true}

	wallet, err := s.repo.GetWallet(ctx, userID)
	if err != nil {
		return nil, err
	}
	walletBalance := 0.0
	if wallet.Balance.Int != nil {
		walletBalance, _ = new(big.Float).SetInt(wallet.Balance.Int).Float64()
		walletBalance *= math.Pow10(int(wallet.Balance.Exp))
	}
	return &pb.WalletResponse{Balance: walletBalance, Currency: wallet.Currency, IsActive: wallet.IsActive}, nil
}

func (s *WalletGRPCServer) ValidateFunds(ctx context.Context, req *pb.FundsRequest) (*pb.FundsResponse, error) {
	userUUID, err := uuid.Parse(req.UserId)
	if err != nil {
		return &pb.FundsResponse{IsValid: false, Message: "ID de usuario inválido"}, nil
	}
	if req.Amount < 0 {
		return &pb.FundsResponse{IsValid: false, Message: "El monto no puede ser negativo"}, nil
	}

	userID := pgtype.UUID{Bytes: userUUID, Valid: true}
	wallet, err := s.repo.GetWallet(ctx, userID)
	if err != nil {
		return &pb.FundsResponse{IsValid: false, Message: "Billetera no encontrada para el usuario"}, nil
	}

	if !wallet.IsActive {
		return &pb.FundsResponse{IsValid: false, Message: "La billetera del usuario está inactiva"}, nil
	}

	walletBalance := 0.0
	if wallet.Balance.Int != nil {
		walletBalance, _ = new(big.Float).SetInt(wallet.Balance.Int).Float64()
		walletBalance *= math.Pow10(int(wallet.Balance.Exp))
	}

	if walletBalance < req.Amount {
		return &pb.FundsResponse{IsValid: false, Message: "Fondos insuficientes"}, nil
	}

	return &pb.FundsResponse{IsValid: true, Message: "Fondos suficientes confirmados"}, nil
}

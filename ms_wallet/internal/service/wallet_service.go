package service

import (
	"ms_wallet/internal/repository"
)

type WalletService struct {
	repo *repository.Queries
}

func NewWalletService(repo *repository.Queries) *WalletService {
	return &WalletService{repo: repo}
}

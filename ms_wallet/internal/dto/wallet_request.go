package dto

type CreateWalletRequest struct {
	UserID string `json:"user_id" validate:"required,uuid"`
}

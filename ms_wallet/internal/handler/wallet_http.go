package handler

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"ms_wallet/internal/service"
)

type TransferRequestPayload struct {
	ReceiverUserID string `json:"receiver_user_id"`
	Amount         string `json:"amount"`
}

type WalletHTTPHandler struct {
	svc *service.WalletService
}

func NewWalletHTTPHandler(svc *service.WalletService) *WalletHTTPHandler {
	return &WalletHTTPHandler{svc: svc}
}

// Helper para extraer y decodificar el user_id de un token JWT
func getUserIDFromToken(authHeader string) (uuid.UUID, error) {
	if authHeader == "" {
		return uuid.Nil, fmt.Errorf("Authorization header faltante")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return uuid.Nil, fmt.Errorf("formato de Authorization header inválido")
	}

	token := parts[1]
	tokenParts := strings.Split(token, ".")
	if len(tokenParts) < 2 {
		return uuid.Nil, fmt.Errorf("token JWT inválido")
	}

	payloadB64 := tokenParts[1]
	
	// Corregir padding si es necesario
	if len(payloadB64)%4 != 0 {
		payloadB64 += strings.Repeat("=", 4-(len(payloadB64)%4))
	}

	// Reemplazar caracteres URL safe si los hay
	payloadB64 = strings.ReplaceAll(payloadB64, "-", "+")
	payloadB64 = strings.ReplaceAll(payloadB64, "_", "/")

	payloadBytes, err := base64.StdEncoding.DecodeString(payloadB64)
	if err != nil {
		return uuid.Nil, fmt.Errorf("error decodificando payload base64: %w", err)
	}

	var claims struct {
		UserID string `json:"user_id"`
	}
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return uuid.Nil, fmt.Errorf("error decodificando claims JSON: %w", err)
	}

	if claims.UserID == "" {
		return uuid.Nil, fmt.Errorf("user_id no encontrado en el token")
	}

	userUUID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return uuid.Nil, fmt.Errorf("user_id del token no es un UUID válido: %w", err)
	}

	return userUUID, nil
}

func (h *WalletHTTPHandler) TransferMoney(w http.ResponseWriter, r *http.Request) {
	// 1. Obtener emisor desde el Token JWT
	authHeader := r.Header.Get("Authorization")
	senderUUID, err := getUserIDFromToken(authHeader)
	if err != nil {
		http.Error(w, fmt.Sprintf("No autorizado: %v", err), http.StatusUnauthorized)
		return
	}

	var payload TransferRequestPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	receiverUUID, err := uuid.Parse(payload.ReceiverUserID)
	if err != nil {
		http.Error(w, "receiver_user_id no es un UUID válido", http.StatusBadRequest)
		return
	}

	amount, err := decimal.NewFromString(payload.Amount)
	if err != nil {
		http.Error(w, "amount debe ser un número válido", http.StatusBadRequest)
		return
	}

	req := service.TransferRequest{
		FromUserID:  senderUUID,
		ToUserID:    receiverUUID,
		Amount:      amount,
		Currency:    "MXN",
		Description: "Transferencia desde App Móvil",
	}

	// Ejecutar la transferencia (transacción ACID)
	transaction, err := h.svc.TransferMoney(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":        "Transferencia exitosa",
		"transaction_id": transaction.ID,
	})
}

// GetWallet maneja las peticiones GET /wallet/ usando el JWT del Header
func (h *WalletHTTPHandler) GetWallet(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	userID, err := getUserIDFromToken(authHeader)
	if err != nil {
		http.Error(w, fmt.Sprintf("No autorizado: %v", err), http.StatusUnauthorized)
		return
	}

	wallet, err := h.svc.GetWallet(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	var balance string
	if wallet.Balance.Valid {
		val, _ := wallet.Balance.Value()
		balance = fmt.Sprintf("%v", val)
	} else {
		balance = "0.00"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":         wallet.ID.Bytes,
		"user_id":    wallet.UserID.Bytes,
		"balance":    balance,
		"currency":   wallet.Currency,
		"is_active":  wallet.IsActive,
		"created_at": wallet.CreatedAt.Time,
	})
}

// DeactivateCard desactiva la tarjeta del usuario
func (h *WalletHTTPHandler) DeactivateCard(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	userID, err := getUserIDFromToken(authHeader)
	if err != nil {
		http.Error(w, fmt.Sprintf("No autorizado: %v", err), http.StatusUnauthorized)
		return
	}

	wallet, err := h.svc.SetActiveStatus(r.Context(), userID, false)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":   "Tarjeta desactivada con éxito",
		"is_active": wallet.IsActive,
	})
}

// ActivateCard activa la tarjeta del usuario
func (h *WalletHTTPHandler) ActivateCard(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	userID, err := getUserIDFromToken(authHeader)
	if err != nil {
		http.Error(w, fmt.Sprintf("No autorizado: %v", err), http.StatusUnauthorized)
		return
	}

	wallet, err := h.svc.SetActiveStatus(r.Context(), userID, true)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":   "Tarjeta activada con éxito",
		"is_active": wallet.IsActive,
	})
}

// GetTransactions obtiene las transacciones del usuario
func (h *WalletHTTPHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	userID, err := getUserIDFromToken(authHeader)
	if err != nil {
		http.Error(w, fmt.Sprintf("No autorizado: %v", err), http.StatusUnauthorized)
		return
	}

	// Por defecto devolvemos las ultimas 50 transacciones
	limit := int32(50)
	offset := int32(0)

	transactions, err := h.svc.GetTransactions(r.Context(), userID, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	
	// Preparamos la respuesta (convirtiendo pgtype a strings/floats según convenga)
	var response []map[string]interface{}
	for _, tx := range transactions {
		var amount string
		if tx.Amount.Valid {
			val, _ := tx.Amount.Value()
			amount = fmt.Sprintf("%v", val)
		}

		response = append(response, map[string]interface{}{
			"id":             tx.ID,
			"from_wallet_id": tx.FromWalletID.Bytes,
			"to_wallet_id":   tx.ToWalletID.Bytes,
			"amount":         amount,
			"currency":       tx.Currency,
			"status":         tx.Status,
			"description":    tx.Description,
			"created_at":     tx.CreatedAt.Time,
		})
	}
	
	if response == nil {
		response = []map[string]interface{}{}
	}

	json.NewEncoder(w).Encode(response)
}

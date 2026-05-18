-- name: CreateWallet :one
INSERT INTO wallets (id, user_id, balance, currency)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetWallet :one
SELECT * FROM wallets WHERE user_id = $1 LIMIT 1;

-- name: GetWalletForUpdate :one
SELECT * FROM wallets 
WHERE id = $1 AND is_active = TRUE 
LIMIT 1 
FOR UPDATE;

-- name: UpdateWalletBalance :one
UPDATE wallets 
SET balance = balance + sqlc.arg(amount), updated_at = NOW()
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: CreateTransaction :one
INSERT INTO transactions (from_wallet_id, to_wallet_id, amount, status, currency, description)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateWalletActiveStatus :one
UPDATE wallets
SET is_active = $2, updated_at = NOW()
WHERE user_id = $1
RETURNING *;

-- name: GetTransactionsByWallet :many
SELECT * FROM transactions
WHERE from_wallet_id = $1 OR to_wallet_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
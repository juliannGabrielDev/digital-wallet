-- name: CreateWallet :one
INSERT INTO wallets (id, user_id, balance, currency)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetWallet :one
SELECT * FROM wallets WHERE user_id = $1 LIMIT 1;
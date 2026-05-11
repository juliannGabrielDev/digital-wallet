# Usamos la imagen oficial de golang más reciente en alpine
FROM golang:alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compilar de forma completamente estática asegurando una ruta y nombre específicos
RUN CGO_ENABLED=0 GOOS=linux go build -a -o /app/wallet-api ./cmd/api/main.go

FROM alpine:latest
# Cambiamos el directorio de trabajo final a /server para evitar colisiones 
# con el volumen ./ms_wallet:/app montado en el docker-compose.yml
WORKDIR /server

# Copiamos el binario ya compilado desde el builder
COPY --from=builder /app/wallet-api .

EXPOSE 8001 50051
CMD ["./wallet-api"]
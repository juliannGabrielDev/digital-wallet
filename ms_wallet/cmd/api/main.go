// ms_wallet/cmd/api/main.go
package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"

	"ms_wallet/internal/events"
	"ms_wallet/internal/grpc/pb"
	"ms_wallet/internal/handler"
	"ms_wallet/internal/repository"
)

func main() {
	// 1. Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: No se encontró archivo .env")
	}

	// ==========================================
	// 2. CONECTAR A POSTGRESQL (CON REINTENTOS)
	// ==========================================
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("La variable DATABASE_URL no está configurada")
	}

	var dbPool *pgxpool.Pool
	var err error

	// Intentar conectar hasta 5 veces, esperando 3 segundos entre intentos
	for i := 1; i <= 5; i++ {
		dbPool, err = pgxpool.New(context.Background(), dbURL)
		if err == nil {
			err = dbPool.Ping(context.Background())
		}

		if err == nil {
			break // ¡Conexión exitosa, salimos del ciclo!
		}

		log.Printf("[ms_wallet] Intento %d: PostgreSQL aún no está listo (%v). Reintentando en 3 segundos...", i, err)
		time.Sleep(3 * time.Second)
	}
	if err != nil {
		log.Fatalf("[ms_wallet] Fallo definitivo al conectar a PostgreSQL después de 5 intentos: %v", err)
	}
	defer dbPool.Close()

	if err := dbPool.Ping(context.Background()); err != nil {
		log.Fatalf("PostgreSQL no responde: %v\n", err)
	}
	log.Println("[ms_wallet] Conectado exitosamente a PostgreSQL")

	// 3. Inicializar Repositorio (sqlc)
	queries := repository.New(dbPool)

	// ==========================================
	// INICIALIZAR Y LEVANTAR RABBITMQ CONSUMER
	// ==========================================
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@localhost:5672/"
	}

	rabbitConsumer, err := events.NewRabbitMQConsumer(rabbitURL, queries)
	if err != nil {
		log.Printf("Aviso: No se pudo conectar a RabbitMQ en este momento: %v\n", err)
	} else {
		defer rabbitConsumer.Close()
		if err := rabbitConsumer.StartListening(); err != nil {
			log.Printf("Error al iniciar consumidor de RabbitMQ: %v\n", err)
		}
	}

	// ==========================================
	// 4. INICIALIZAR Y LEVANTAR SERVIDOR gRPC
	// ==========================================
	grpcServer := grpc.NewServer()
	walletHandler := handler.NewWalletGRPCServer(queries)

	// Registrar nuestro handler en el servidor gRPC
	pb.RegisterWalletServiceServer(grpcServer, walletHandler)

	// Ejecutamos el servidor gRPC en una goroutine (segundo plano)
	go func() {
		listener, err := net.Listen("tcp", ":50051")
		if err != nil {
			log.Fatalf("Error al abrir puerto gRPC: %v", err)
		}
		log.Println("[ms_wallet] Servidor gRPC escuchando en puerto 50051")
		if err := grpcServer.Serve(listener); err != nil {
			log.Fatalf("Error al servir gRPC: %v", err)
		}
	}()

	// ==========================================
	// 5. INICIALIZAR Y LEVANTAR SERVIDOR HTTP
	// ==========================================
	router := chi.NewRouter()
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)

	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ms_wallet HTTP ok"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	log.Printf("[ms_wallet] Servidor HTTP escuchando en el puerto %s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}

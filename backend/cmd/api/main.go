package main

import (
	"log"
	"net/http"
	"os"

	"github.com/alexmaisa/spinner/backend/internal/api"
	"github.com/alexmaisa/spinner/backend/internal/database"
)

// CORSMiddleware applies broad CORS headers for simple and safe local/dockerized communication.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// 1. Establish configurations
	dbPath := getEnv("DB_PATH", "./spinner.db")
	port := getEnv("PORT", "8080")

	// 2. Initialize Database
	log.Printf("Initializing database at: %s", dbPath)
	if err := database.InitDB(dbPath); err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}
	defer database.DB.Close()
	log.Println("Database successfully initialized and migrated.")

	// 3. Register HTTP Routes
	mux := http.NewServeMux()

	// Public Auth endpoints
	mux.HandleFunc("/api/auth/register", api.RegisterHandler)
	mux.HandleFunc("/api/auth/login", api.LoginHandler)

	// Custom configuration APIs (wrapped in JWT parsing middleware)
	mux.Handle("/api/spinners", api.AuthMiddleware(http.HandlerFunc(api.SpinnerConfigHandler)))
	mux.Handle("/api/spinners/", api.AuthMiddleware(http.HandlerFunc(api.SingleSpinnerHandler)))

	// Randomization endpoints
	mux.Handle("/api/spin", api.AuthMiddleware(http.HandlerFunc(api.SpinHandler)))
	mux.Handle("/api/history", api.AuthMiddleware(http.HandlerFunc(api.HistoryHandler)))

	// WebSocket Multiplayer endpoint
	mux.HandleFunc("/api/rooms/", api.WebSocketHandler)

	// Health check endpoint
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"healthy"}`))
	})

	// 4. Start HTTP Server with CORS
	serverAddr := ":" + port
	log.Printf("Server is starting on %s (HTTP)...", serverAddr)
	if err := http.ListenAndServe(serverAddr, CORSMiddleware(mux)); err != nil {
		log.Fatalf("Fatal: Server failed to start: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

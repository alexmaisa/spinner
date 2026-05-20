package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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

	// Serve static files from the frontend/dist directory in production
	fs := http.FileServer(http.Dir("./frontend/dist"))
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// If path doesn't start with /api/, serve from static files
		if !strings.HasPrefix(r.URL.Path, "/api/") {
			// Check if file exists, if not serve index.html (fallback for React routing)
			path := filepath.Join("./frontend/dist", r.URL.Path)
			_, err := os.Stat(path)
			if os.IsNotExist(err) {
				http.ServeFile(w, r, "./frontend/dist/index.html")
				return
			}
			fs.ServeHTTP(w, r)
			return
		}
		// Otherwise return 404 for unmatched API routes
		http.NotFound(w, r)
	}))

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

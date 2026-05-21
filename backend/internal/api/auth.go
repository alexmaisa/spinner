package api

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/alexmaisa/spinner/backend/internal/database"
	"github.com/alexmaisa/spinner/backend/internal/email"
	"github.com/alexmaisa/spinner/backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte(getEnv("JWT_SECRET", "spinner-default-secret-key-super-secure"))

// SMTP configuration loaded once at startup.
var smtpConfig = email.LoadConfig()

// frontendURL is the base URL for the frontend (used for magic-link redirects).
var frontendURL = getEnv("FRONTEND_URL", "http://localhost:5173")

// emailRegex validates basic email format.
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

type contextKey string

const UserContextKey contextKey = "user"

// Claims represents the JWT claims payload.
type Claims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// GenerateJWT creates a JWT token signed with our secret key (30-day expiry).
func GenerateJWT(userID int64, email string) (string, error) {
	expirationTime := time.Now().Add(30 * 24 * time.Hour) // 30 days
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// AuthMiddleware authenticates a request using the Bearer JWT token.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, `{"error":"Invalid authorization header format"}`, http.StatusUnauthorized)
			return
		}

		tokenStr := parts[1]
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, `{"error":"Invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		// Inject user info into context
		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireAuth forces requests to be authenticated.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(UserContextKey).(*Claims)
		if !ok || claims == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Authentication required"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

// MagicLinkRequestHandler handles magic-link login requests.
// POST /api/auth/magic-link — accepts {"email":"user@example.com"}
func MagicLinkRequestHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.MagicLinkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if !emailRegex.MatchString(req.Email) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Please enter a valid email address"})
		return
	}

	// Rate limiting / Cooldown check: prevent requesting magic links too frequently
	lastTime, err := database.GetLastMagicTokenTime(req.Email)
	if err == nil && !lastTime.IsZero() {
		if time.Since(lastTime) < 60*time.Second {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Please wait 60 seconds before requesting another login link.",
			})
			return
		}
	}

	// Generate a cryptographically secure random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		http.Error(w, `{"error":"Failed to generate secure token"}`, http.StatusInternalServerError)
		return
	}
	magicToken := hex.EncodeToString(tokenBytes)

	// Store the token with 15-minute expiry
	expiresAt := time.Now().Add(15 * time.Minute)
	if err := database.CreateMagicToken(req.Email, magicToken, expiresAt); err != nil {
		http.Error(w, `{"error":"Failed to create login token"}`, http.StatusInternalServerError)
		return
	}

	// Determine the base URL for the magic link verification endpoint
	baseURL := getEnv("BASE_URL", "")
	if baseURL == "" {
		// Fall back to constructing from the request
		scheme := "http"
		if r.TLS != nil {
			scheme = "https"
		}
		if fwdProto := r.Header.Get("X-Forwarded-Proto"); fwdProto != "" {
			scheme = fwdProto
		}
		baseURL = scheme + "://" + r.Host
	}

	// Send the magic link email
	if err := email.SendMagicLink(smtpConfig, req.Email, magicToken, baseURL); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to send magic link email. Please try again."})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Magic link sent! Check your email inbox.",
	})
}

// MagicLinkVerifyHandler verifies the magic token and redirects to the frontend with a JWT.
// GET /api/auth/verify?token=xxx
func MagicLinkVerifyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		http.Error(w, "Missing token parameter", http.StatusBadRequest)
		return
	}

	// Verify the magic token
	userEmail, err := database.VerifyMagicToken(tokenStr)
	if err != nil {
		// Redirect to frontend with error
		redirectURL := frontendURL + "/?auth_error=" + err.Error()
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
		return
	}

	// Find or create the user
	user, err := database.FindOrCreateUserByEmail(userEmail)
	if err != nil {
		redirectURL := frontendURL + "/?auth_error=Account creation failed"
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
		return
	}

	// Generate JWT (30-day session)
	jwtToken, err := GenerateJWT(user.ID, user.Email)
	if err != nil {
		redirectURL := frontendURL + "/?auth_error=Token generation failed"
		http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
		return
	}

	// Redirect to frontend with the JWT
	redirectURL := frontendURL + "/?auth_token=" + jwtToken
	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

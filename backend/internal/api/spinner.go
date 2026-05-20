package api

import (
	"crypto/rand"
	"encoding/json"
	"math/big"
	"net/http"
	"strconv"
	"strings"

	"github.com/alexmaisa/spinner/backend/internal/database"
	"github.com/alexmaisa/spinner/backend/internal/models"
	"github.com/alexmaisa/spinner/backend/internal/rng"
)

// GenerateShortID creates a secure, unguessable 8-character unique string for sharing configs.
func GenerateShortID() string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, 8)
	for i := range result {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			// Extremely unlikely fallback
			result[i] = chars[0]
			continue
		}
		result[i] = chars[num.Int64()]
	}
	return string(result)
}

// SpinHandler processes secure server-side randomizations.
func SpinHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.SpinRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	var resp models.SpinResponse

	// Perform secure randomization based on the requested type
	switch strings.ToLower(req.Type) {
	case "coin":
		idx, err := rng.GetSecureRandomIndex(2)
		if err != nil {
			http.Error(w, `{"error":"Randomization failed"}`, http.StatusInternalServerError)
			return
		}
		resp.Index = idx
		if idx == 0 {
			resp.Result = "Heads"
		} else {
			resp.Result = "Tails"
		}

	case "dice":
		sides := int64(6)
		if req.Max != nil && *req.Max > 0 {
			sides = *req.Max
		}
		val, err := rng.GetSecureRandomInt(1, sides)
		if err != nil {
			http.Error(w, `{"error":"Randomization failed"}`, http.StatusInternalServerError)
			return
		}
		resp.Index = int(val)
		resp.Result = strconv.FormatInt(val, 10)

	case "number":
		min := int64(1)
		max := int64(100)
		if req.Min != nil {
			min = *req.Min
		}
		if req.Max != nil {
			max = *req.Max
		}
		val, err := rng.GetSecureRandomInt(min, max)
		if err != nil {
			http.Error(w, `{"error":"Randomization failed"}`, http.StatusInternalServerError)
			return
		}
		resp.Index = int(val)
		resp.Result = strconv.FormatInt(val, 10)

	case "wheel", "list":
		if len(req.Weights) == 0 {
			http.Error(w, `{"error":"Weights or options cannot be empty"}`, http.StatusBadRequest)
			return
		}
		idx, err := rng.GetSecureRandomWeightedIndex(req.Weights)
		if err != nil {
			http.Error(w, `{"error":"Randomization failed"}`, http.StatusInternalServerError)
			return
		}
		resp.Index = idx
		resp.Result = strconv.Itoa(idx)

	default:
		http.Error(w, `{"error":"Unknown randomization type"}`, http.StatusBadRequest)
		return
	}

	// Proactively record the spin to history if the user is logged in
	claims, ok := r.Context().Value(UserContextKey).(*Claims)
	if ok && claims != nil {
		_ = database.AddSpinHistory(&claims.UserID, nil, req.Type, resp.Result)
	}

	json.NewEncoder(w).Encode(resp)
}

// SpinnerConfigHandler handles saving, editing, deleting, and loading spinner configurations.
func SpinnerConfigHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Get potential JWT claims
	var userID *int64
	claims, hasClaims := r.Context().Value(UserContextKey).(*Claims)
	if hasClaims && claims != nil {
		userID = &claims.UserID
	}

	switch r.Method {
	case http.MethodPost: // Save or update config
		var cfg models.SpinnerConfig
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			http.Error(w, `{"error":"Invalid request payload"}`, http.StatusBadRequest)
			return
		}

		cfg.Title = strings.TrimSpace(cfg.Title)
		if cfg.Title == "" {
			cfg.Title = "Untitled Spinner"
		}

		// If saving a new config (ID is empty), generate an 8-char code.
		if cfg.ID == "" {
			cfg.ID = GenerateShortID()
		} else {
			// If updating, verify the user owns it (if it has an owner)
			existing, err := database.GetSpinnerConfig(cfg.ID)
			if err == nil && existing.UserID != nil {
				if userID == nil || *existing.UserID != *userID {
					w.WriteHeader(http.StatusForbidden)
					json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized to update this spinner"})
					return
				}
			}
		}

		cfg.UserID = userID // Bind to logged-in user, or NULL if anonymous
		if err := database.SaveSpinnerConfig(&cfg); err != nil {
			http.Error(w, `{"error":"Failed to save configuration"}`, http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(cfg)

	case http.MethodGet: // Get user's saved spinners (Requires Auth)
		if userID == nil {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Authentication required to list saved configurations"})
			return
		}

		configs, err := database.GetUserSpinnerConfigs(*userID)
		if err != nil {
			http.Error(w, `{"error":"Failed to retrieve configurations"}`, http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(configs)

	default:
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// SingleSpinnerHandler retrieves a single spinner by ID (anonymous read) or deletes it (requires auth).
func SingleSpinnerHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, `{"error":"Invalid URL path"}`, http.StatusBadRequest)
		return
	}
	id := parts[3]

	claims, hasClaims := r.Context().Value(UserContextKey).(*Claims)

	switch r.Method {
	case http.MethodGet: // Public access to fetch a spinner configuration by ID
		cfg, err := database.GetSpinnerConfig(id)
		if err != nil {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Spinner not found"})
			return
		}
		json.NewEncoder(w).Encode(cfg)

	case http.MethodDelete: // Private access to delete
		if !hasClaims || claims == nil {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Authentication required"})
			return
		}

		err := database.DeleteSpinnerConfig(id, claims.UserID)
		if err != nil {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": "Spinner deleted successfully"})

	default:
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}

// HistoryHandler retrieves the user's spin history.
func HistoryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	claims, ok := r.Context().Value(UserContextKey).(*Claims)
	if !ok || claims == nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Authentication required"})
		return
	}

	limit := 50
	limitStr := r.URL.Query().Get("limit")
	if limitStr != "" {
		if val, err := strconv.Atoi(limitStr); err == nil && val > 0 {
			limit = val
		}
	}

	history, err := database.GetUserSpinHistory(claims.UserID, limit)
	if err != nil {
		http.Error(w, `{"error":"Failed to retrieve history"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(history)
}

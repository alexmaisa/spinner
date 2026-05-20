package models

import "time"

// User represents a registered user account.
type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

// SpinnerConfig represents a saved randomization configuration (e.g., custom wheel or dice settings).
type SpinnerConfig struct {
	ID        string    `json:"id"`
	UserID    *int64    `json:"user_id,omitempty"` // Nullable for anonymous sharing
	Title     string    `json:"title"`
	Type      string    `json:"type"`       // "wheel", "dice", "coin", "number", "list"
	Data      string    `json:"data"`       // JSON payload containing configuration specifics
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// SpinHistory tracks the outcome of randomizations for stats and logs.
type SpinHistory struct {
	ID        int64     `json:"id"`
	UserID    *int64    `json:"user_id,omitempty"`
	SpinnerID *string   `json:"spinner_id,omitempty"`
	Type      string    `json:"type"`
	Result    string    `json:"result"`
	CreatedAt time.Time `json:"created_at"`
}

// RegisterRequest is the payload for registering a new user.
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginRequest is the payload for logging in.
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// AuthResponse is returned on successful authentication.
type AuthResponse struct {
	Token    string `json:"token"`
	Username string `json:"username"`
}

// SpinRequest is the payload for triggering a server-side secure spin.
type SpinRequest struct {
	Type    string    `json:"type"` // "wheel", "dice", "coin", "number", "list"
	Weights []float64 `json:"weights,omitempty"` // For weighted wheels
	Min     *int64    `json:"min,omitempty"`     // For random number range
	Max     *int64    `json:"max,omitempty"`     // For random number range
}

// SpinResponse is returned when a server-side spin is requested.
type SpinResponse struct {
	Index  int    `json:"index"`  // Selected index (for wheel/list)
	Result string `json:"result"` // Readable string result
}

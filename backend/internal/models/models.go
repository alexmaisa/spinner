package models

import "time"

// User represents a registered user account (passwordless, email-only).
type User struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
}

// MagicToken represents a single-use login token sent via email.
type MagicToken struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	Used      bool      `json:"used"`
	CreatedAt time.Time `json:"created_at"`
}

// MagicLinkRequest is the payload for requesting a magic login link.
type MagicLinkRequest struct {
	Email string `json:"email"`
}

// AuthResponse is returned on successful authentication.
type AuthResponse struct {
	Token string `json:"token"`
	Email string `json:"email"`
}

// SpinnerConfig represents a saved randomization configuration (e.g., custom wheel or dice settings).
type SpinnerConfig struct {
	ID        string    `json:"id"`
	UserID    *int64    `json:"user_id,omitempty"` // Nullable for anonymous sharing
	Title     string    `json:"title"`
	Type      string    `json:"type"` // "wheel", "dice", "coin", "number", "list"
	Data      string    `json:"data"` // JSON payload containing configuration specifics
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

// SpinRequest is the payload for triggering a server-side secure spin.
type SpinRequest struct {
	Type    string    `json:"type"`              // "wheel", "dice", "coin", "number", "list"
	Weights []float64 `json:"weights,omitempty"` // For weighted wheels
	Min     *int64    `json:"min,omitempty"`     // For random number range
	Max     *int64    `json:"max,omitempty"`     // For random number range
}

// SpinResponse is returned when a server-side spin is requested.
type SpinResponse struct {
	Index  int    `json:"index"`  // Selected index (for wheel/list)
	Result string `json:"result"` // Readable string result
}

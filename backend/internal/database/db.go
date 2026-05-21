package database

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	_ "modernc.org/sqlite" // Pure Go SQLite driver

	"github.com/alexmaisa/spinner/backend/internal/models"
)

var DB *sql.DB

// InitDB initializes the SQLite database and runs simple schema migrations.
func InitDB(dataSourceName string) error {
	db, err := sql.Open("sqlite", dataSourceName)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if err = db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	DB = db
	return MigrateSchema()
}

// MigrateSchema creates necessary tables in the SQLite database if they don't exist.
func MigrateSchema() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT UNIQUE NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS magic_tokens (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL,
			ip_address TEXT,
			token TEXT UNIQUE NOT NULL,
			expires_at DATETIME NOT NULL,
			used INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS spinners (
			id TEXT PRIMARY KEY,
			user_id INTEGER,
			title TEXT NOT NULL,
			type TEXT NOT NULL,
			data TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER,
			spinner_id TEXT,
			type TEXT NOT NULL,
			result TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
			FOREIGN KEY(spinner_id) REFERENCES spinners(id) ON DELETE SET NULL
		);`,
	}

	for _, query := range queries {
		if _, err := DB.Exec(query); err != nil {
			return fmt.Errorf("migration query failed: %w", err)
		}
	}

	// Try to add ip_address column to existing databases if it doesn't exist
	_, _ = DB.Exec(`ALTER TABLE magic_tokens ADD COLUMN ip_address TEXT`)

	return nil
}

// FindOrCreateUserByEmail returns an existing user by email, or creates a new one if not found.
func FindOrCreateUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	var createdAtStr string

	// Try to find existing user
	err := DB.QueryRow(`SELECT id, email, created_at FROM users WHERE email = ?`, email).
		Scan(&user.ID, &user.Email, &createdAtStr)

	if err == nil {
		user.CreatedAt = parseTime(createdAtStr)
		return user, nil
	}

	if !errors.Is(err, sql.ErrNoRows) {
		return nil, fmt.Errorf("failed to query user: %w", err)
	}

	// Create new user
	query := `INSERT INTO users (email, created_at) VALUES (?, ?) RETURNING id, email, created_at`
	now := time.Now()
	err = DB.QueryRow(query, email, now).Scan(&user.ID, &user.Email, &createdAtStr)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	user.CreatedAt = parseTime(createdAtStr)
	return user, nil
}

// CreateMagicToken stores a new magic login token for the given email and client IP.
func CreateMagicToken(email, ipAddress, token string, expiresAt time.Time) error {
	query := `INSERT INTO magic_tokens (email, ip_address, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`
	_, err := DB.Exec(query, email, ipAddress, token, expiresAt, time.Now())
	return err
}

// GetLastMagicTokenTime retrieves the created_at timestamp of the most recent token for this email.
func GetLastMagicTokenTime(email string) (time.Time, error) {
	var createdAtStr string
	query := `SELECT created_at FROM magic_tokens WHERE email = ? ORDER BY created_at DESC LIMIT 1`
	err := DB.QueryRow(query, email).Scan(&createdAtStr)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return time.Time{}, nil
		}
		return time.Time{}, err
	}
	return parseTime(createdAtStr), nil
}

// GetLastMagicTokenTimeByIP retrieves the created_at timestamp of the most recent token for this IP address.
func GetLastMagicTokenTimeByIP(ip string) (time.Time, error) {
	if ip == "" {
		return time.Time{}, nil
	}
	var createdAtStr string
	query := `SELECT created_at FROM magic_tokens WHERE ip_address = ? ORDER BY created_at DESC LIMIT 1`
	err := DB.QueryRow(query, ip).Scan(&createdAtStr)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return time.Time{}, nil
		}
		return time.Time{}, err
	}
	return parseTime(createdAtStr), nil
}

// VerifyMagicToken checks if a magic token is valid (exists, not expired, not used).
// On success, it marks the token as used and returns the associated email.
func VerifyMagicToken(token string) (string, error) {
	var id int64
	var email string
	var expiresAtStr string
	var used int

	query := `SELECT id, email, expires_at, used FROM magic_tokens WHERE token = ?`
	err := DB.QueryRow(query, token).Scan(&id, &email, &expiresAtStr, &used)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", errors.New("invalid or expired magic link")
		}
		return "", fmt.Errorf("failed to query magic token: %w", err)
	}

	if used != 0 {
		return "", errors.New("this magic link has already been used")
	}

	expiresAt := parseTime(expiresAtStr)
	if time.Now().After(expiresAt) {
		return "", errors.New("this magic link has expired")
	}

	// Mark token as used
	_, err = DB.Exec(`UPDATE magic_tokens SET used = 1 WHERE id = ?`, id)
	if err != nil {
		return "", fmt.Errorf("failed to mark token as used: %w", err)
	}

	return email, nil
}

// CleanupExpiredTokens removes magic tokens that have expired or been used.
func CleanupExpiredTokens() error {
	_, err := DB.Exec(`DELETE FROM magic_tokens WHERE used = 1 OR expires_at < ?`, time.Now())
	return err
}

// SaveSpinnerConfig saves or updates a spinner configuration.
func SaveSpinnerConfig(cfg *models.SpinnerConfig) error {
	query := `INSERT INTO spinners (id, user_id, title, type, data, created_at, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			title = excluded.title,
			data = excluded.data,
			updated_at = excluded.updated_at`

	now := time.Now()
	_, err := DB.Exec(query, cfg.ID, cfg.UserID, cfg.Title, cfg.Type, cfg.Data, now, now)
	return err
}

// GetSpinnerConfig retrieves a spinner config by its unique short ID.
func GetSpinnerConfig(id string) (*models.SpinnerConfig, error) {
	query := `SELECT id, user_id, title, type, data, created_at, updated_at FROM spinners WHERE id = ?`
	cfg := &models.SpinnerConfig{}
	var createdAtStr, updatedAtStr string

	err := DB.QueryRow(query, id).Scan(&cfg.ID, &cfg.UserID, &cfg.Title, &cfg.Type, &cfg.Data, &createdAtStr, &updatedAtStr)
	if err != nil {
		return nil, err
	}

	cfg.CreatedAt = parseTime(createdAtStr)
	cfg.UpdatedAt = parseTime(updatedAtStr)

	return cfg, nil
}

// GetUserSpinnerConfigs retrieves all saved spinner configs for a user.
func GetUserSpinnerConfigs(userID int64) ([]*models.SpinnerConfig, error) {
	query := `SELECT id, user_id, title, type, data, created_at, updated_at FROM spinners WHERE user_id = ? ORDER BY updated_at DESC`
	rows, err := DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var configs []*models.SpinnerConfig
	for rows.Next() {
		cfg := &models.SpinnerConfig{}
		var createdAtStr, updatedAtStr string
		err := rows.Scan(&cfg.ID, &cfg.UserID, &cfg.Title, &cfg.Type, &cfg.Data, &createdAtStr, &updatedAtStr)
		if err != nil {
			return nil, err
		}

		cfg.CreatedAt = parseTime(createdAtStr)
		cfg.UpdatedAt = parseTime(updatedAtStr)

		configs = append(configs, cfg)
	}

	return configs, nil
}

// DeleteSpinnerConfig removes a spinner configuration by ID.
func DeleteSpinnerConfig(id string, userID int64) error {
	query := `DELETE FROM spinners WHERE id = ? AND user_id = ?`
	res, err := DB.Exec(query, id, userID)
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("spinner config not found or unauthorized")
	}

	return nil
}

// AddSpinHistory records a spin result.
func AddSpinHistory(userID *int64, spinnerID *string, spinType, result string) error {
	query := `INSERT INTO history (user_id, spinner_id, type, result, created_at) VALUES (?, ?, ?, ?, ?)`
	_, err := DB.Exec(query, userID, spinnerID, spinType, result, time.Now())
	return err
}

// GetUserSpinHistory retrieves spin history for a specific user.
func GetUserSpinHistory(userID int64, limit int) ([]*models.SpinHistory, error) {
	query := `SELECT id, user_id, spinner_id, type, result, created_at FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
	rows, err := DB.Query(query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []*models.SpinHistory
	for rows.Next() {
		h := &models.SpinHistory{}
		var createdAtStr string
		err := rows.Scan(&h.ID, &h.UserID, &h.SpinnerID, &h.Type, &h.Result, &createdAtStr)
		if err != nil {
			return nil, err
		}

		h.CreatedAt = parseTime(createdAtStr)

		history = append(history, h)
	}

	return history, nil
}

// parseTime attempts to parse a time string in common SQLite formats.
func parseTime(s string) time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err == nil {
		return t
	}
	t, err = time.Parse("2006-01-02 15:04:05", s)
	if err == nil {
		return t
	}
	t, err = time.Parse("2006-01-02T15:04:05Z", s)
	if err == nil {
		return t
	}
	return time.Time{}
}

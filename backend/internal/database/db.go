package database

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	_ "modernc.org/sqlite" // Pure Go SQLite driver

	"github.com/alexmaisa/spinner/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
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
			username TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
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

	return nil
}

// CreateUser registers a new user with a hashed password.
func CreateUser(username, password string) (*models.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	query := `INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?) RETURNING id, username, created_at`
	user := &models.User{}
	var createdAtStr string

	err = DB.QueryRow(query, username, string(hashedPassword), time.Now()).Scan(&user.ID, &user.Username, &createdAtStr)
	if err != nil {
		return nil, err // Could be duplicate username error
	}

	user.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
	if user.CreatedAt.IsZero() {
		// Fallback parse for sqlite timestamp formats
		user.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
	}

	return user, nil
}

// AuthenticateUser verifies user credentials and returns the user object if successful.
func AuthenticateUser(username, password string) (*models.User, error) {
	query := `SELECT id, username, password_hash, created_at FROM users WHERE username = ?`
	user := &models.User{}
	var createdAtStr string

	err := DB.QueryRow(query, username).Scan(&user.ID, &user.Username, &user.PasswordHash, &createdAtStr)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("invalid username or password")
		}
		return nil, err
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return nil, errors.New("invalid username or password")
	}

	user.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
	if user.CreatedAt.IsZero() {
		user.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
	}

	return user, nil
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

	cfg.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
	if cfg.CreatedAt.IsZero() {
		cfg.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
	}

	cfg.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAtStr)
	if cfg.UpdatedAt.IsZero() {
		cfg.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAtStr)
	}

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

		cfg.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
		if cfg.CreatedAt.IsZero() {
			cfg.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		}

		cfg.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAtStr)
		if cfg.UpdatedAt.IsZero() {
			cfg.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAtStr)
		}

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

		h.CreatedAt, _ = time.Parse(time.RFC3339, createdAtStr)
		if h.CreatedAt.IsZero() {
			h.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAtStr)
		}

		history = append(history, h)
	}

	return history, nil
}

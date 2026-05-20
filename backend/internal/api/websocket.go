package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/alexmaisa/spinner/backend/internal/database"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow CORS for local development. In production, this can be tightened.
		return true
	},
}

// Room represents a live synchronized spin session.
type Room struct {
	ID       string
	Config   interface{} // Current active spinner configuration
	HostConn *websocket.Conn
	Clients  map[*websocket.Conn]bool
	Mutex    sync.RWMutex
}

// RoomManager orchestrates active co-spinning rooms.
type RoomManager struct {
	rooms map[string]*Room
	mutex sync.RWMutex
}

var Manager = &RoomManager{
	rooms: make(map[string]*Room),
}

// GetOrCreateRoom retrieves an existing room or instantiates a new one.
func (rm *RoomManager) GetOrCreateRoom(roomID string) *Room {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	if room, exists := rm.rooms[roomID]; exists {
		return room
	}

	room := &Room{
		ID:      roomID,
		Clients: make(map[*websocket.Conn]bool),
	}
	rm.rooms[roomID] = room
	return room
}

// RemoveRoom cleans up a room when everyone departs.
func (rm *RoomManager) RemoveRoom(roomID string) {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()
	delete(rm.rooms, roomID)
}

// Broadcast sends a message to all clients in a room except optionally the sender.
func (r *Room) Broadcast(msg []byte, exclude *websocket.Conn) {
	r.Mutex.RLock()
	defer r.Mutex.RUnlock()

	for client := range r.Clients {
		if client == exclude {
			continue
		}
		err := client.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Printf("WS: Error writing message to client: %v", err)
			// Connection is likely broken; will be handled by client reader
		}
	}
}

// SendMemberCount broadcasts the total number of connections to all room members.
func (r *Room) SendMemberCount() {
	r.Mutex.RLock()
	count := len(r.Clients)
	r.Mutex.RUnlock()

	payload, err := json.Marshal(map[string]interface{}{
		"action": "member_count",
		"count":  count,
	})
	if err == nil {
		r.Broadcast(payload, nil)
	}
}

// WSAction represents the structural format of incoming websocket events.
type WSAction struct {
	Action      string      `json:"action"`
	TargetIndex int         `json:"target_index,omitempty"`
	Duration    float64     `json:"duration,omitempty"` // Spin duration in seconds
	Config      interface{} `json:"config,omitempty"`
}

// WebSocketHandler upgrades connection and orchestrates client sync events.
func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	// Format: /api/rooms/{id}/ws
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	roomID := parts[3]

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WS Upgrade Error: %v", err)
		return
	}
	defer conn.Close()

	room := Manager.GetOrCreateRoom(roomID)

	// Auth check to designate Host.
	// If a valid JWT is provided and corresponds to the spinner's owner, client is Host.
	isHost := false
	tokenStr := r.URL.Query().Get("token")
	if tokenStr != "" {
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
		if err == nil && token.Valid {
			// Verify if this user owns the spinner config associated with this room.
			cfg, err := database.GetSpinnerConfig(roomID)
			if err == nil && cfg.UserID != nil && *cfg.UserID == claims.UserID {
				isHost = true
			}
		}
	}

	room.Mutex.Lock()
	room.Clients[conn] = true
	if isHost {
		// Replace previous host if any
		room.HostConn = conn
	}
	// If room has an active config, send it to the newly joined viewer
	var activeConfig []byte
	if room.Config != nil {
		activeConfig, _ = json.Marshal(map[string]interface{}{
			"action": "sync_config",
			"config": room.Config,
		})
	}
	room.Mutex.Unlock()

	// Proactively sync config on connection
	if len(activeConfig) > 0 {
		_ = conn.WriteMessage(websocket.TextMessage, activeConfig)
	}

	// Update counts
	room.SendMemberCount()

	// Inform client of their connection status
	welcome, _ := json.Marshal(map[string]interface{}{
		"action":  "welcome",
		"is_host": isHost,
	})
	_ = conn.WriteMessage(websocket.TextMessage, welcome)

	log.Printf("WS: Client connected to Room %s (Host=%t). Total clients: %d", roomID, isHost, len(room.Clients))

	// Event loop
	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("WS Error: Client disconnected from Room %s: %v", roomID, err)
			break
		}

		var action WSAction
		if err := json.Unmarshal(message, &action); err != nil {
			log.Printf("WS Error: Failed to parse action: %v", err)
			continue
		}

		// Security: Only allow Hosts to trigger spin and config sync events
		if !isHost && (action.Action == "spin" || action.Action == "sync_config") {
			errPayload, _ := json.Marshal(map[string]string{
				"action":  "error",
				"message": "Only the host can trigger actions",
			})
			_ = conn.WriteMessage(websocket.TextMessage, errPayload)
			continue
		}

		switch action.Action {
		case "spin":
			// Broadcast the spin event to everyone in the room
			payload, err := json.Marshal(map[string]interface{}{
				"action":       "spin",
				"target_index": action.TargetIndex,
				"duration":     action.Duration,
			})
			if err == nil {
				room.Broadcast(payload, nil)
			}

		case "sync_config":
			// Update the cache and broadcast the configuration change
			room.Mutex.Lock()
			room.Config = action.Config
			room.Mutex.Unlock()

			payload, err := json.Marshal(map[string]interface{}{
				"action": "sync_config",
				"config": action.Config,
			})
			if err == nil {
				room.Broadcast(payload, conn) // Sync to viewers only
			}
		}
	}

	// Cleanup on disconnect
	room.Mutex.Lock()
	delete(room.Clients, conn)
	if room.HostConn == conn {
		room.HostConn = nil
	}
	clientsRemaining := len(room.Clients)
	room.Mutex.Unlock()

	if clientsRemaining == 0 {
		Manager.RemoveRoom(roomID)
		log.Printf("WS: Room %s has been deleted (no clients remaining)", roomID)
	} else {
		room.SendMemberCount()
	}
}

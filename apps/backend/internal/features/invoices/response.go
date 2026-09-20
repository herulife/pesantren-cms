package invoices

import (
	"encoding/json"
	"net/http"
)

// APIResponse struktur standar response API.
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// SendErrorResponse mengirim error response.
func SendErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(APIResponse{Success: false, Message: message})
}

// SendSuccessResponse mengirim success response dengan data.
func SendSuccessResponse(w http.ResponseWriter, statusCode int, data interface{}, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(APIResponse{Success: true, Message: message, Data: data})
}

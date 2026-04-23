package psb

import (
	"encoding/json"
	"net/http"
)

// APIResponse adalah struktur standar untuk semua response API
type APIResponse struct {
	Success    bool                   `json:"success"`
	Message    string                 `json:"message,omitempty"`
	Data       interface{}            `json:"data,omitempty"`
	Pagination map[string]interface{} `json:"pagination,omitempty"`
}

// SendResponse mengirim response JSON dengan format standar
func SendResponse(w http.ResponseWriter, statusCode int, success bool, message string, data interface{}, pagination map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := APIResponse{
		Success:    success,
		Message:    message,
		Data:       data,
		Pagination: pagination,
	}

	json.NewEncoder(w).Encode(response)
}

// SendErrorResponse mengirim error response
func SendErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	SendResponse(w, statusCode, false, message, nil, nil)
}

// SendSuccessResponse mengirim success response dengan data
func SendSuccessResponse(w http.ResponseWriter, statusCode int, data interface{}, message string) {
	SendResponse(w, statusCode, true, message, data, nil)
}

// SendSuccessResponseWithPagination mengirim success response dengan pagination
func SendSuccessResponseWithPagination(w http.ResponseWriter, statusCode int, data interface{}, pagination map[string]interface{}, message string) {
	SendResponse(w, statusCode, true, message, data, pagination)
}

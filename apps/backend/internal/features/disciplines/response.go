package disciplines

import (
	"encoding/json"
	"net/http"
)

type APIResponse struct {
	Success    bool                   `json:"success"`
	Message    string                 `json:"message,omitempty"`
	Data       interface{}            `json:"data,omitempty"`
	Pagination map[string]interface{} `json:"pagination,omitempty"`
}

func SendResponse(w http.ResponseWriter, statusCode int, success bool, message string, data interface{}, pagination map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(APIResponse{
		Success:    success,
		Message:    message,
		Data:       data,
		Pagination: pagination,
	})
}

func SendErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	SendResponse(w, statusCode, false, message, nil, nil)
}

func SendSuccessResponse(w http.ResponseWriter, statusCode int, data interface{}, message string) {
	SendResponse(w, statusCode, true, message, data, nil)
}

func SendSuccessResponseWithPagination(w http.ResponseWriter, statusCode int, data interface{}, pagination map[string]interface{}, message string) {
	SendResponse(w, statusCode, true, message, data, pagination)
}

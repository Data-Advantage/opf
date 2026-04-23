package pptxdev

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// An APIError is returned when the API responds with a non-success HTTP status
// and a JSON body containing an "error" field, or for other HTTP failures.
type APIError struct {
	StatusCode int
	Code       string
	Message    string
	RequestID  string
	Details    json.RawMessage
	Body       []byte
}

func (e *APIError) Error() string {
	if e.Message != "" {
		return fmt.Sprintf("pptx.dev API %d: %s", e.StatusCode, e.Message)
	}
	return fmt.Sprintf("pptx.dev API %d", e.StatusCode)
}

func apiErrorFromResponse(resp *http.Response, body []byte) error {
	err := &APIError{StatusCode: resp.StatusCode, Body: body}
	var parsed APIErrorResponse
	if json.Unmarshal(body, &parsed) == nil {
		err.Code = parsed.Error.Code
		err.Message = parsed.Error.Message
		err.RequestID = parsed.Error.RequestID
		err.Details = parsed.Error.Details
	}
	if headerRequestID := resp.Header.Get("X-Request-Id"); headerRequestID != "" {
		err.RequestID = headerRequestID
	}
	return err
}

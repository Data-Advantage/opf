package pptxdev

import "encoding/json"

// ValidationIssue matches the validate endpoint issue object.
type ValidationIssue struct {
	Path    string `json:"path"`
	Message string `json:"message"`
}

// ValidateResponse is the JSON body from POST /v1/validate.
type ValidateResponse struct {
	Valid    bool              `json:"valid"`
	Errors   []ValidationIssue `json:"errors"`
	Warnings []ValidationIssue `json:"warnings"`
}

// ParseAcceptedResponse is returned by POST /v1/parse.
type ParseAcceptedResponse struct {
	ParseID    string `json:"parseId"`
	SlideCount int    `json:"slideCount"`
	Width      int    `json:"width"`
	Height     int    `json:"height"`
}

// GenerateAcceptedResponse is returned with HTTP 202 from POST /v1/generate.
type GenerateAcceptedResponse struct {
	Status             string   `json:"status"`
	Message            string   `json:"message"`
	Format             string   `json:"format"`
	SlideCount         int      `json:"slideCount"`
	ValidationWarnings []string `json:"validationWarnings"`
}

// APIErrorEnvelope is the nested error object returned by /v1 endpoints.
type APIErrorEnvelope struct {
	Code      string          `json:"code"`
	Message   string          `json:"message"`
	Details   json.RawMessage `json:"details,omitempty"`
	RequestID string          `json:"requestId,omitempty"`
}

// APIErrorResponse is the JSON error envelope returned by /v1 endpoints.
type APIErrorResponse struct {
	Error APIErrorEnvelope `json:"error"`
}

// ValidationErrorDetails is returned under error.details for OPF validation failures.
type ValidationErrorDetails struct {
	Errors []ValidationIssue `json:"errors"`
}

// TextRun is a single styled text fragment on a slide.
type TextRun struct {
	Text       string  `json:"text,omitempty"`
	Bold       bool    `json:"bold,omitempty"`
	Italic     bool    `json:"italic,omitempty"`
	Underline  bool    `json:"underline,omitempty"`
	FontSize   float64 `json:"fontSize,omitempty"`
	FontFamily string  `json:"fontFamily,omitempty"`
	Color      string  `json:"color,omitempty"`
	Alignment  string  `json:"alignment,omitempty"`
}

// ParseSlideResponse is the JSON body from GET /v1/parse/{parseId}/slides/{index}.
type ParseSlideResponse struct {
	Index        int       `json:"index"`
	SlideNumber  int       `json:"slideNumber"`
	Hidden       bool      `json:"hidden"`
	Width        int       `json:"width"`
	Height       int       `json:"height"`
	TextRuns     []TextRun `json:"textRuns"`
	SpeakerNotes string    `json:"speakerNotes,omitempty"`
}

// ParseMetadataResponse is the JSON body from GET /v1/parse/{parseId}/metadata.
type ParseMetadataResponse struct {
	ParseID string          `json:"parseId"`
	Core    json.RawMessage `json:"core"`
	App     json.RawMessage `json:"app"`
	Custom  json.RawMessage `json:"custom"`
}

// ParseTextResponse is the JSON body from GET /v1/parse/{parseId}/text.
type ParseTextResponse struct {
	ParseID string            `json:"parseId"`
	Slides  []json.RawMessage `json:"slides"`
}

// RenderWebResponse is returned with HTTP 200 from POST /v1/render when format=web.
type RenderWebResponse struct {
	ParseID    string          `json:"parseId"`
	Format     string          `json:"format"`
	Dimensions json.RawMessage `json:"dimensions"`
	SlideCount int             `json:"slideCount"`
	Slides     json.RawMessage `json:"slides"`
	Metadata   json.RawMessage `json:"metadata"`
	ViewerURL  string          `json:"viewerUrl"`
}

// RenderAcceptedResponse is returned with HTTP 202 from POST /v1/render for export formats.
type RenderAcceptedResponse struct {
	Status     string `json:"status"`
	Message    string `json:"message"`
	ParseID    string `json:"parseId"`
	Format     string `json:"format"`
	SlideCount int    `json:"slideCount"`
	ViewerURL  string `json:"viewerUrl"`
}

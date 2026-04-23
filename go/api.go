package pptxdev

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"strconv"
)

// Validate runs POST /v1/validate with an OPF JSON document.
func (c *Client) Validate(ctx context.Context, opf json.RawMessage) (*ValidateResponse, error) {
	var out ValidateResponse
	if err := c.doJSON(ctx, http.MethodPost, nil, []byte(opf), &out, "v1", "validate"); err != nil {
		return nil, err
	}
	return &out, nil
}

// ParsePPTX uploads a .pptx via POST /v1/parse.
func (c *Client) ParsePPTX(ctx context.Context, filename string, file io.Reader) (*ParseAcceptedResponse, error) {
	var out ParseAcceptedResponse
	if err := c.postMultipart(ctx, nil, "file", filename, file, "", &out, "v1", "parse"); err != nil {
		return nil, err
	}
	return &out, nil
}

// ConvertPPTX uploads a .pptx via POST /v1/convert and returns the OPF JSON document.
func (c *Client) ConvertPPTX(ctx context.Context, filename string, file io.Reader) (json.RawMessage, error) {
	var out json.RawMessage
	if err := c.postMultipart(ctx, nil, "file", filename, file, "", &out, "v1", "convert"); err != nil {
		return nil, err
	}
	return out, nil
}

// OpfValidationError is returned when the server responds with HTTP 422 from POST /v1/generate.
type OpfValidationError struct {
	Code             string
	Message          string
	RequestID        string
	ValidationErrors []ValidationIssue
}

func (e *OpfValidationError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return "invalid OPF document"
}

// Generate runs POST /v1/generate. Format may be "", "pptx", "pdf", "png", or "svg" (default pptx).
func (c *Client) Generate(ctx context.Context, format string, opf json.RawMessage) (*GenerateAcceptedResponse, error) {
	q := url.Values{}
	if format != "" {
		q.Set("format", format)
	}
	var out GenerateAcceptedResponse
	err := c.doJSON(ctx, http.MethodPost, q, []byte(opf), &out, "v1", "generate")
	if err == nil {
		return &out, nil
	}
	var api *APIError
	if errors.As(err, &api) && api.StatusCode == http.StatusUnprocessableEntity {
		var details ValidationErrorDetails
		if len(api.Details) > 0 && json.Unmarshal(api.Details, &details) == nil {
			return nil, &OpfValidationError{
				Code:             api.Code,
				Message:          api.Message,
				RequestID:        api.RequestID,
				ValidationErrors: details.Errors,
			}
		}
	}
	return nil, err
}

// RenderWeb runs POST /v1/render with format=web (defaults when format is "").
func (c *Client) RenderWeb(ctx context.Context, filename string, file io.Reader, slideNumbers1Based []int) (*RenderWebResponse, error) {
	q := url.Values{}
	q.Set("format", "web")
	if s := joinIntsComma(slideNumbers1Based); s != "" {
		q.Set("slides", s)
	}
	var out RenderWebResponse
	if err := c.postMultipart(ctx, q, "file", filename, file, "", &out, "v1", "render"); err != nil {
		return nil, err
	}
	return &out, nil
}

// RenderExport runs POST /v1/render with format svg or png. slideNumbers1Based is optional (1-based indices).
func (c *Client) RenderExport(ctx context.Context, filename string, file io.Reader, format string, slideNumbers1Based []int) (*RenderAcceptedResponse, error) {
	q := url.Values{}
	q.Set("format", format)
	if s := joinIntsComma(slideNumbers1Based); s != "" {
		q.Set("slides", s)
	}
	var out RenderAcceptedResponse
	if err := c.postMultipart(ctx, q, "file", filename, file, "", &out, "v1", "render"); err != nil {
		return nil, err
	}
	return &out, nil
}

// ParseMetadata runs GET /v1/parse/{parseId}/metadata.
func (c *Client) ParseMetadata(ctx context.Context, parseID string) (*ParseMetadataResponse, error) {
	var out ParseMetadataResponse
	if err := c.doJSON(ctx, http.MethodGet, nil, nil, &out, "v1", "parse", parseID, "metadata"); err != nil {
		return nil, err
	}
	return &out, nil
}

// ParseSlide runs GET /v1/parse/{parseId}/slides/{index} (zero-based index).
func (c *Client) ParseSlide(ctx context.Context, parseID string, index int) (*ParseSlideResponse, error) {
	var out ParseSlideResponse
	if err := c.doJSON(ctx, http.MethodGet, nil, nil, &out, "v1", "parse", parseID, "slides", strconv.Itoa(index)); err != nil {
		return nil, err
	}
	return &out, nil
}

// ParseText runs GET /v1/parse/{parseId}/text.
func (c *Client) ParseText(ctx context.Context, parseID string) (*ParseTextResponse, error) {
	var out ParseTextResponse
	if err := c.doJSON(ctx, http.MethodGet, nil, nil, &out, "v1", "parse", parseID, "text"); err != nil {
		return nil, err
	}
	return &out, nil
}
